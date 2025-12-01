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
import { Database } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";
type TableName = keyof Database["public"]["Tables"];
type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
type Insert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
type Update<T extends TableName> = Database["public"]["Tables"][T]["Update"];
/**
 * Type-safe query builder for a specific table
 */
export declare class TypedQueryBuilder<T extends TableName> {
    protected client: SupabaseClient<Database>;
    private table;
    constructor(client: SupabaseClient<Database>, table: T);
    /**
     * Select rows with type safety
     */
    select<K extends keyof Row<T>>(...columns: K[]): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, Pick<Row<T>, K>[], T, unknown>;
    /**
     * Select all columns
     */
    selectAll(): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, Row<T>[], T, unknown>;
    /**
     * Select a single row by ID
     */
    selectById(id: string): import("@supabase/postgrest-js").PostgrestBuilder<(true | (Row<T> extends infer T_1 ? T_1 extends Row<T> ? T_1 extends any[] ? {
        Error: "Type mismatch: Cannot cast single object to array type. Remove Array wrapper from return type or make sure you are not using .single() up in the calling chain";
    } : true : never : never) extends infer ValidationResult ? ValidationResult extends true ? Row<T> | null : ValidationResult : never) | import("node_modules/@supabase/postgrest-js/dist/cjs/types").CheckMatchingArrayTypes<T extends string ? any : any, Row<T> | null>, false>;
    /**
     * Insert a new row with type safety
     */
    insert(data: Insert<T>): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, (Row<T> extends infer T_1 ? T_1 extends Row<T> ? T_1 extends any[] ? true : {
        Error: "Type mismatch: Cannot cast array result to a single object. Use .overrideTypes<Array<YourType>> or .returns<Array<YourType>> (deprecated) for array results or .single() to convert the result to a single object";
    } : never : never) extends infer ValidationResult ? ValidationResult extends true ? Row<T> : ValidationResult : never, T, unknown>;
    /**
     * Insert multiple rows with type safety
     */
    insertMany(data: Insert<T>[]): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, Row<T>[], T, unknown>;
    /**
     * Update a row by ID with type safety
     */
    updateById(id: string, data: Update<T>): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, (Row<T> extends infer T_1 ? T_1 extends Row<T> ? T_1 extends any[] ? true : {
        Error: "Type mismatch: Cannot cast array result to a single object. Use .overrideTypes<Array<YourType>> or .returns<Array<YourType>> (deprecated) for array results or .single() to convert the result to a single object";
    } : never : never) extends infer ValidationResult ? ValidationResult extends true ? Row<T> : ValidationResult : never, T, unknown>;
    /**
     * Update rows matching a filter with type safety
     */
    update(filter: Partial<Row<T>>, data: Update<T>): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, Row<T>[], T, unknown>;
    /**
     * Delete a row by ID
     */
    deleteById(id: string): import("@supabase/postgrest-js").PostgrestFilterBuilder<any, any, null, T, unknown>;
    /**
     * Filter by a specific column
     */
    where<K extends keyof Row<T>>(column: K, value: Row<T>[K]): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, Row<T>[], T, unknown>;
    /**
     * Filter by multiple conditions
     */
    whereMultiple(conditions: Partial<Row<T>>): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, Row<T>[], T, unknown>;
    /**
     * Order results by a column
     */
    orderBy<K extends keyof Row<T>>(column: K, ascending?: boolean): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, Row<T>[], T, unknown>;
    /**
     * Limit results
     */
    limit(count: number): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, Row<T>[], T, unknown>;
    /**
     * Get raw query builder for complex operations
     */
    get raw(): import("@supabase/postgrest-js").PostgrestQueryBuilder<any, any, T, unknown>;
}
/**
 * Create a typed query builder for a specific table
 */
export declare function createTypedQueryBuilder<T extends TableName>(client: SupabaseClient<Database>, table: T): TypedQueryBuilder<T>;
/**
 * Specialized query builders for common tables
 */
export declare class UsersQueryBuilder extends TypedQueryBuilder<"users"> {
    constructor(client: SupabaseClient<Database>);
    /**
     * Find users by subscription status
     */
    findBySubscriptionStatus(status: "active" | "trialing" | "cancelled" | "past_due"): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, import("@/types/database").User[], "users", unknown>;
    /**
     * Find users who completed onboarding
     */
    findCompletedOnboarding(): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, import("@/types/database").User[], "users", unknown>;
    /**
     * Update user's push token
     */
    updatePushToken(userId: string, token: string | null): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, {
        Error: "Type mismatch: Cannot cast array result to a single object. Use .overrideTypes<Array<YourType>> or .returns<Array<YourType>> (deprecated) for array results or .single() to convert the result to a single object";
    }, "users", unknown>;
}
export declare class PromisesQueryBuilder extends TypedQueryBuilder<"promises"> {
    constructor(client: SupabaseClient<Database>);
    /**
     * Find promises for a specific user and date
     */
    findByUserAndDate(userId: string, date: string): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, import("@/types/database").UserPromise[], "promises", unknown>;
    /**
     * Find promises by status
     */
    findByStatus(status: "pending" | "kept" | "broken"): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, import("@/types/database").UserPromise[], "promises", unknown>;
    /**
     * Find today's promises for a user
     */
    findTodaysPromises(userId: string): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, import("@/types/database").UserPromise[], "promises", unknown>;
    /**
     * Update promise status
     */
    updateStatus(promiseId: string, status: "pending" | "kept" | "broken", excuseText?: string): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, {
        Error: "Type mismatch: Cannot cast array result to a single object. Use .overrideTypes<Array<YourType>> or .returns<Array<YourType>> (deprecated) for array results or .single() to convert the result to a single object";
    }, "promises", unknown>;
}
export declare class CallsQueryBuilder extends TypedQueryBuilder<"calls"> {
    constructor(client: SupabaseClient<Database>);
    /**
     * Find calls for a user by type
     */
    findByUserAndType(userId: string, callType: Database["public"]["Tables"]["calls"]["Row"]["call_type"]): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, import("@/types/database").CallRecording[], "calls", unknown>;
    /**
     * Find calls within a date range
     */
    findByDateRange(userId: string, startDate: string, endDate: string): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, import("@/types/database").CallRecording[], "calls", unknown>;
    /**
     * Find successful calls
     */
    findSuccessfulCalls(): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, import("@/types/database").CallRecording[], "calls", unknown>;
}
export declare class IdentityQueryBuilder extends TypedQueryBuilder<"identity"> {
    constructor(client: SupabaseClient<Database>);
    /**
     * Find identity by user ID
     */
    findByUserId(userId: string): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, import("@/types/database").Identity[], "identity", unknown>;
    /**
     * Update identity fields
     */
    updateIdentityFields(userId: string, fields: Partial<Database["public"]["Tables"]["identity"]["Update"]>): import("@supabase/postgrest-js").PostgrestTransformBuilder<any, any, {
        Error: "Type mismatch: Cannot cast array result to a single object. Use .overrideTypes<Array<YourType>> or .returns<Array<YourType>> (deprecated) for array results or .single() to convert the result to a single object";
    }, "identity", unknown>;
}
/**
 * Factory function to create specialized query builders
 */
export declare function createQueryBuilders(client: SupabaseClient<Database>): {
    users: UsersQueryBuilder;
    promises: PromisesQueryBuilder;
    calls: CallsQueryBuilder;
    identity: IdentityQueryBuilder;
    table: <T extends TableName>(table: T) => TypedQueryBuilder<T>;
};
export {};
