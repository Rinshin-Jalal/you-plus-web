# AWS Setup Guide for Daily Call Scheduling

Quick guide to get the AWS values needed for `.dev.vars`:

## Step 1: Get AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

1. Go to https://console.aws.amazon.com/iam/
2. Click **Users** in the left sidebar
3. Click **Create user**
4. User name: `youplus-cli` (or any name you prefer)
5. Click **Next**
6. Select **Attach policies directly**
7. Search and check: `AdministratorAccess` (or more restrictive policies if preferred)
8. Click **Next** > **Create user**
9. Click on the newly created user
10. Go to **Security credentials** tab
11. Click **Create access key**
12. Select **Command Line Interface (CLI)**
13. Click **Next** > **Create access key**
14. **IMPORTANT:** Copy both values immediately (you won't see the secret again!)

```
AWS_ACCESS_KEY_ID=AKIA... (starts with AKIA, 20 characters)
AWS_SECRET_ACCESS_KEY=... (40 characters, random string)
```

## Step 2: Configure AWS CLI

```bash
aws configure
# Enter:
# - AWS Access Key ID: [paste from step 1]
# - AWS Secret Access Key: [paste from step 1]
# - Default region: us-east-1
# - Default output format: json
```

## Step 3: Run Infrastructure Setup Script

This creates the IAM roles and schedule group, and outputs the ARNs you need:

```bash
cd lambda/infrastructure
chmod +x setup-eventbridge.sh
./setup-eventbridge.sh
```

**Save the output!** You'll see something like:

```
AWS_LAMBDA_FUNCTION_ARN=arn:aws:lambda:us-east-1:123456789012:function:youplus-daily-call-trigger
AWS_SCHEDULER_ROLE_ARN=arn:aws:iam::123456789012:role/youplus-scheduler-role
AWS_SCHEDULE_GROUP_NAME=youplus-daily-calls
```

**Note:** The Lambda function ARN will only be valid after you deploy the Lambda function (Step 4).

## Step 4: Deploy Lambda Function

1. **Create the Lambda function:**
   - Go to https://console.aws.amazon.com/lambda/
   - Click **Create function**
   - Function name: `youplus-daily-call-trigger`
   - Runtime: **Node.js 20.x**
   - Architecture: **x86_64**
   - Click **Create function**

2. **Deploy the code:**
   ```bash
   cd lambda/daily-call-trigger
   npm install
   zip -r function.zip .
   
   # Upload via AWS CLI
   aws lambda update-function-code \
     --function-name youplus-daily-call-trigger \
     --zip-file fileb://function.zip \
     --region us-east-1
   ```

3. **Get the Lambda Function ARN:**
   - In Lambda console, click on your function
   - Copy the **ARN** from the top of the page
   - Format: `arn:aws:lambda:us-east-1:123456789012:function:youplus-daily-call-trigger`

## Step 5: Update .dev.vars

Add these values to your `backend/.dev.vars` file:

```bash
# From Step 1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# From Step 3
AWS_SCHEDULER_ROLE_ARN=arn:aws:iam::123456789012:role/youplus-scheduler-role

# From Step 4 (after Lambda is deployed)
AWS_LAMBDA_FUNCTION_ARN=arn:aws:lambda:us-east-1:123456789012:function:youplus-daily-call-trigger
```

## Quick Reference

| Variable | Where to Get It |
|----------|----------------|
| `AWS_ACCESS_KEY_ID` | IAM Console > Users > Create Access Key |
| `AWS_SECRET_ACCESS_KEY` | Same as above (copy immediately!) |
| `AWS_SCHEDULER_ROLE_ARN` | Output from `setup-eventbridge.sh` script |
| `AWS_LAMBDA_FUNCTION_ARN` | Lambda Console > Function > Copy ARN (after deployment) |

## Troubleshooting

**"Access Denied" errors:**
- Make sure your IAM user has `AdministratorAccess` or the required permissions
- Check that AWS CLI is configured correctly: `aws sts get-caller-identity`

**Lambda ARN not found:**
- Make sure you've deployed the Lambda function first
- Check the region matches (default is `us-east-1`)

**Script fails:**
- Ensure AWS CLI is installed: `aws --version`
- Check AWS credentials: `aws sts get-caller-identity`
- Verify you're in the correct directory: `cd lambda/infrastructure`

