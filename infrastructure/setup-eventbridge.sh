#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# EventBridge Scheduler Infrastructure Setup
# ═══════════════════════════════════════════════════════════════════════════
#
# This script sets up the AWS infrastructure needed for per-user call scheduling:
# 1. IAM Role for EventBridge Scheduler to invoke Lambda
# 2. IAM Role for Lambda execution
# 3. Lambda function for triggering Cartesia calls
#
# Prerequisites:
# - AWS CLI configured with appropriate credentials
# - Environment variables set (see below)
#
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Configuration
REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
LAMBDA_FUNCTION_NAME="youplus-daily-call-trigger"
SCHEDULER_ROLE_NAME="youplus-scheduler-role"
LAMBDA_ROLE_NAME="youplus-lambda-role"

echo "Setting up EventBridge Scheduler infrastructure..."
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"

# ═══════════════════════════════════════════════════════════════════════════
# Step 1: Create IAM Role for Lambda
# ═══════════════════════════════════════════════════════════════════════════

echo "Creating Lambda execution role..."

cat > /tmp/lambda-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role (ignore error if exists)
aws iam create-role \
  --role-name $LAMBDA_ROLE_NAME \
  --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
  2>/dev/null || echo "Lambda role already exists"

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name $LAMBDA_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  2>/dev/null || true

echo "✓ Lambda execution role ready"

# ═══════════════════════════════════════════════════════════════════════════
# Step 2: Create IAM Role for EventBridge Scheduler
# ═══════════════════════════════════════════════════════════════════════════

echo "Creating EventBridge Scheduler role..."

cat > /tmp/scheduler-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "scheduler.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role (ignore error if exists)
aws iam create-role \
  --role-name $SCHEDULER_ROLE_NAME \
  --assume-role-policy-document file:///tmp/scheduler-trust-policy.json \
  2>/dev/null || echo "Scheduler role already exists"

# Create inline policy to invoke Lambda
cat > /tmp/scheduler-lambda-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${LAMBDA_FUNCTION_NAME}"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name $SCHEDULER_ROLE_NAME \
  --policy-name invoke-lambda \
  --policy-document file:///tmp/scheduler-lambda-policy.json \
  2>/dev/null || true

echo "✓ EventBridge Scheduler role ready"

# ═══════════════════════════════════════════════════════════════════════════
# Step 3: Create Schedule Group for user schedules
# ═══════════════════════════════════════════════════════════════════════════

echo "Creating schedule group..."

aws scheduler create-schedule-group \
  --name youplus-daily-calls \
  --region $REGION \
  2>/dev/null || echo "Schedule group already exists"

echo "✓ Schedule group ready"

# ═══════════════════════════════════════════════════════════════════════════
# Output
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "Infrastructure setup complete!"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "ARNs for your CF Worker environment:"
echo ""
echo "AWS_LAMBDA_FUNCTION_ARN=arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${LAMBDA_FUNCTION_NAME}"
echo "AWS_SCHEDULER_ROLE_ARN=arn:aws:iam::${ACCOUNT_ID}:role/${SCHEDULER_ROLE_NAME}"
echo "AWS_SCHEDULE_GROUP_NAME=youplus-daily-calls"
echo ""
echo "Next steps:"
echo "1. Deploy the Lambda function: cd lambda/daily-call-trigger && npm run deploy"
echo "2. Add these env vars to your CF Worker (wrangler.toml or secrets)"
echo "3. Test schedule creation via the CF Worker API"
echo ""
