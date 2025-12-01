/**
 * Type-Safe Database Query Builders
 *
 * This module provides type-safe query builders for Supabase operations.
 * It ensures that database queries are type-checked at compile time and
 * provides a more ergonomic API for common database operations.
 *
 * Benefits:
 * 1. Compile-time type checking for database queries
 * 2. Autocomplete for table names and column names
 * 3. Type-safe query parameters
 * 4. Clear error messages for type mismatches
 * 5. Reduced runtime errors due to type issues
 */
/**
 * Type-safe query builder for a specific table
 */
export class TypedQueryBuilder {
    client;
    table;
    constructor(client, table) {
        this.client = client;
        this.table = table;
    }
    /**
     * Select rows with type safety
     */
    select(...columns) {
        return this.client
            .from(this.table)
            .select(columns.join(","))
            .returns();
    }
    /**
     * Select all columns
     */
    selectAll() {
        return this.client.from(this.table).select("*").returns();
    }
    /**
     * Select a single row by ID
     */
    selectById(id) {
        return this.client
            .from(this.table)
            .select("*")
            .eq("id", id)
            .maybeSingle()
            .returns();
    }
    /**
     * Insert a new row with type safety
     */
    insert(data) {
        return this.client.from(this.table).insert(data).select().returns();
    }
    /**
     * Insert multiple rows with type safety
     */
    insertMany(data) {
        return this.client.from(this.table).insert(data).select().returns();
    }
    /**
     * Update a row by ID with type safety
     */
    updateById(id, data) {
        return this.client
            .from(this.table)
            .update(data)
            .eq("id", id)
            .select()
            .returns();
    }
    /**
     * Update rows matching a filter with type safety
     */
    update(filter, data) {
        let query = this.client.from(this.table).update(data);
        // Apply all filter conditions
        Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        return query.select().returns();
    }
    /**
     * Delete a row by ID
     */
    deleteById(id) {
        return this.client.from(this.table).delete().eq("id", id);
    }
    /**
     * Filter by a specific column
     */
    where(column, value) {
        return this.client
            .from(this.table)
            .select("*")
            .eq(column, value)
            .returns();
    }
    /**
     * Filter by multiple conditions
     */
    whereMultiple(conditions) {
        let query = this.client.from(this.table).select("*");
        Object.entries(conditions).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        return query.returns();
    }
    /**
     * Order results by a column
     */
    orderBy(column, ascending = true) {
        return this.client
            .from(this.table)
            .select("*")
            .order(column, { ascending })
            .returns();
    }
    /**
     * Limit results
     */
    limit(count) {
        return this.client
            .from(this.table)
            .select("*")
            .limit(count)
            .returns();
    }
    /**
     * Get raw query builder for complex operations
     */
    get raw() {
        return this.client.from(this.table);
    }
}
/**
 * Create a typed query builder for a specific table
 */
export function createTypedQueryBuilder(client, table) {
    return new TypedQueryBuilder(client, table);
}
/**
 * Specialized query builders for common tables
 */
// Users table query builder
export class UsersQueryBuilder extends TypedQueryBuilder {
    constructor(client) {
        super(client, "users");
    }
    /**
     * Find users by subscription status
     */
    findBySubscriptionStatus(status) {
        return this.where("subscription_status", status);
    }
    /**
     * Find users who completed onboarding
     */
    findCompletedOnboarding() {
        return this.where("onboarding_completed", true);
    }
    /**
     * Update user's push token
     */
    updatePushToken(userId, token) {
        const updateData = {};
        if (token !== null) {
            updateData.push_token = token;
        }
        return this.updateById(userId, updateData);
    }
}
// Promises table query builder
export class PromisesQueryBuilder extends TypedQueryBuilder {
    constructor(client) {
        super(client, "promises");
    }
    /**
     * Find promises for a specific user and date
     */
    findByUserAndDate(userId, date) {
        return this.whereMultiple({ user_id: userId, promise_date: date });
    }
    /**
     * Find promises by status
     */
    findByStatus(status) {
        return this.where("status", status);
    }
    /**
     * Find today's promises for a user
     */
    findTodaysPromises(userId) {
        const today = new Date().toISOString().split('T')[0];
        if (!today)
            throw new Error("Could not generate today's date");
        return this.findByUserAndDate(userId, today);
    }
    /**
     * Update promise status
     */
    updateStatus(promiseId, status, excuseText) {
        const updateData = { status };
        if (excuseText) {
            updateData.excuse_text = excuseText;
        }
        return this.updateById(promiseId, updateData);
    }
}
// Calls table query builder
export class CallsQueryBuilder extends TypedQueryBuilder {
    constructor(client) {
        super(client, "calls");
    }
    /**
     * Find calls for a user by type
     */
    findByUserAndType(userId, callType) {
        return this.whereMultiple({ user_id: userId, call_type: callType });
    }
    /**
     * Find calls within a date range
     */
    findByDateRange(userId, startDate, endDate) {
        return this.client
            .from("calls")
            .select("*")
            .eq("user_id", userId)
            .gte("created_at", startDate)
            .lte("created_at", endDate)
            .returns();
    }
    /**
     * Find successful calls
     */
    findSuccessfulCalls() {
        return this.where("call_successful", "success");
    }
}
// Identity table query builder
export class IdentityQueryBuilder extends TypedQueryBuilder {
    constructor(client) {
        super(client, "identity");
    }
    /**
     * Find identity by user ID
     */
    findByUserId(userId) {
        return this.where("user_id", userId);
    }
    /**
     * Update identity fields
     */
    updateIdentityFields(userId, fields) {
        return this.client
            .from("identity")
            .update(fields)
            .eq("user_id", userId)
            .select()
            .returns();
    }
}
/**
 * Factory function to create specialized query builders
 */
export function createQueryBuilders(client) {
    return {
        users: new UsersQueryBuilder(client),
        promises: new PromisesQueryBuilder(client),
        calls: new CallsQueryBuilder(client),
        identity: new IdentityQueryBuilder(client),
        // Generic query builder for any table
        table: (table) => createTypedQueryBuilder(client, table),
    };
}
