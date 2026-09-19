"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifeGuardStack = void 0;
const cdk = require("aws-cdk-lib");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const kms = require("aws-cdk-lib/aws-kms");
const cognito = require("aws-cdk-lib/aws-cognito");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const iam = require("aws-cdk-lib/aws-iam");
const budgets = require("aws-cdk-lib/aws-budgets");
const path = require("path");
class LifeGuardStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // 1. KMS Key for Envelope Encryption of Refresh Tokens & Financial Data
        const encryptionKey = new kms.Key(this, "LifeGuardEncryptionKey", {
            enableKeyRotation: true,
            description: "KMS Key for LifeGuard refresh tokens and financial data encryption",
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // 2. DynamoDB Tables (On-Demand Pay-per-use, No idle costs)
        const risksTable = new dynamodb.Table(this, "LifeGuardRisksTable", {
            tableName: "lifeguard_risks",
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey,
        });
        const actionsTable = new dynamodb.Table(this, "LifeGuardActionsTable", {
            tableName: "lifeguard_action_proposals",
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey,
        });
        const logsTable = new dynamodb.Table(this, "LifeGuardAuditLogsTable", {
            tableName: "lifeguard_audit_logs",
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey,
        });
        const authTable = new dynamodb.Table(this, "LifeGuardGoogleAuthTable", {
            tableName: "lifeguard_google_auth",
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey,
        });
        // 3. Amazon Cognito User Pool for Identity
        const userPool = new cognito.UserPool(this, "LifeGuardUserPool", {
            userPoolName: "lifeguard-user-pool",
            selfSignUpEnabled: true,
            signInAliases: { email: true },
            autoVerify: { email: true },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const userPoolClient = new cognito.UserPoolClient(this, "LifeGuardUserPoolClient", {
            userPool,
            userPoolClientName: "lifeguard-web-client",
            generateSecret: false,
            authFlows: {
                userSrp: true,
                custom: true,
            },
            oAuth: {
                flows: { authorizationCodeGrant: true },
                scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
                callbackUrls: ["http://localhost:5173/callback", "http://localhost:3002/api/auth/google/callback"],
                logoutUrls: ["http://localhost:5173/"],
            },
        });
        // 4. Lambda Handler for Backend Server & Bedrock Agent Loop
        const apiLambda = new lambda.Function(this, "LifeGuardApiLambda", {
            functionName: "lifeguard-backend-api",
            runtime: lambda.Runtime.NODEJS_20_X,
            architecture: lambda.Architecture.ARM_64, // Cheaper pay-per-use
            handler: "server.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "../../backend/dist")),
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            environment: {
                USE_DYNAMODB: "true",
                KMS_KEY_ID: encryptionKey.keyId,
                COGNITO_USER_POOL_ID: userPool.userPoolId,
                COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
                DYNAMO_RISKS_TABLE: risksTable.tableName,
                DYNAMO_ACTIONS_TABLE: actionsTable.tableName,
                DYNAMO_LOGS_TABLE: logsTable.tableName,
                DYNAMO_AUTH_TABLE: authTable.tableName,
            },
        });
        // Grant Lambda permissions to DynamoDB, KMS, and Bedrock Converse API
        risksTable.grantReadWriteData(apiLambda);
        actionsTable.grantReadWriteData(apiLambda);
        logsTable.grantReadWriteData(apiLambda);
        authTable.grantReadWriteData(apiLambda);
        encryptionKey.grantEncryptDecrypt(apiLambda);
        apiLambda.addToRolePolicy(new iam.PolicyStatement({
            actions: [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream",
                "bedrock:Converse",
                "bedrock:ConverseStream",
            ],
            resources: ["*"],
        }));
        // 5. API Gateway Rest API
        const api = new apigateway.LambdaRestApi(this, "LifeGuardRestApi", {
            handler: apiLambda,
            proxy: true,
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ["Authorization", "Content-Type"],
            },
        });
        // 6. AWS Budgets Alarm ($10 Cost Guard)
        new budgets.CfnBudget(this, "LifeGuardCostBudget", {
            budget: {
                budgetName: "lifeguard-monthly-budget",
                budgetType: "COST",
                timeUnit: "MONTHLY",
                budgetLimit: {
                    amount: 10,
                    unit: "USD",
                },
            },
            notificationsWithSubscribers: [
                {
                    notification: {
                        notificationType: "ACTUAL",
                        comparisonOperator: "GREATER_THAN",
                        threshold: 80,
                        thresholdType: "PERCENTAGE",
                    },
                    subscribers: [
                        {
                            subscriptionType: "EMAIL",
                            address: "admin@lifeguard.ai",
                        },
                    ],
                },
            ],
        });
        // Outputs
        new cdk.CfnOutput(this, "ApiUrl", { value: api.url || "http://localhost:3002" });
        new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
        new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
        new cdk.CfnOutput(this, "KmsKeyId", { value: encryptionKey.keyId });
    }
}
exports.LifeGuardStack = LifeGuardStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWd1YXJkLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGlmZWd1YXJkLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQyxxREFBcUQ7QUFDckQsMkNBQTJDO0FBQzNDLG1EQUFtRDtBQUNuRCxpREFBaUQ7QUFDakQseURBQXlEO0FBQ3pELDJDQUEyQztBQUMzQyxtREFBbUQ7QUFDbkQsNkJBQTZCO0FBRTdCLE1BQWEsY0FBZSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzNDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsd0VBQXdFO1FBQ3hFLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLEVBQUU7WUFDaEUsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixXQUFXLEVBQUUsb0VBQW9FO1lBQ2pGLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDekMsQ0FBQyxDQUFDO1FBRUgsNERBQTREO1FBQzVELE1BQU0sVUFBVSxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDakUsU0FBUyxFQUFFLGlCQUFpQjtZQUM1QixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNqRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDeEMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCO1lBQ3JELGFBQWE7U0FDZCxDQUFDLENBQUM7UUFFSCxNQUFNLFlBQVksR0FBRyxJQUFJ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dUJBQXVCLEVBQUUsQ0FBQyxDQUFDO1FBQ2pGLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsRUFBRSxLQUFLLEVBQUUsY0FBYyxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQztRQUN4RixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxFQUFFLEtBQUssRUFBRSxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUN0RSxDQUFDO0NBQ0Y7QUEvSkQsd0NBK0pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gXCJhd3MtY2RrLWxpYlwiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGJcIjtcbmltcG9ydCAqIGFzIGttcyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWttc1wiO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZ25pdG9cIjtcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxhbWJkYVwiO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXlcIjtcbmltcG9ydCAqIGFzIGlhbSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xuaW1wb3J0ICogYXMgYnVkZ2V0cyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWJ1ZGdldHNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcblxuZXhwb3J0IGNsYXNzIExpZmVHdWFyZFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gMS4gS01TIEtleSBmb3IgRW52ZWxvcGUgRW5jcnlwdGlvbiBvZiBSZWZyZXNoIFRva2VucyAmIEZpbmFuY2lhbCBEYXRhXG4gICAgY29uc3QgZW5jcnlwdGlvbktleSA9IG5ldyBrbXMuS2V5KHRoaXMsIFwiTGlmZUd1YXJkRW5jcnlwdGlvbktleVwiLCB7XG4gICAgICBlbmFibGVLZXlSb3RhdGlvbjogdHJ1ZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIktNUyBLZXkgZm9yIExpZmVHdWFyZCByZWZyZXNoIHRva2VucyBhbmQgZmluYW5jaWFsIGRhdGEgZW5jcnlwdGlvblwiLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIC8vIDIuIER5bmFtb0RCIFRhYmxlcyAoT24tRGVtYW5kIFBheS1wZXItdXNlLCBObyBpZGxlIGNvc3RzKVxuICAgIGNvbnN0IHJpc2tzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgXCJMaWZlR3VhcmRSaXNrc1RhYmxlXCIsIHtcbiAgICAgIHRhYmxlTmFtZTogXCJsaWZlZ3VhcmRfcmlza3NcIixcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiBcImlkXCIsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5DVVNUT01FUl9NQU5BR0VELFxuICAgICAgZW5jcnlwdGlvbktleSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGFjdGlvbnNUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCBcIkxpZmVHdWFyZEFjdGlvbnNUYWJsZVwiLCB7XG4gICAgICB0YWJsZU5hbWU6IFwibGlmZWd1YXJkX2FjdGlvbl9wcm9wb3NhbHNcIixcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiBcImlkXCIsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5DVVNUT01FUl9NQU5BR0VELFxuICAgICAgZW5jcnlwdGlvbktleSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGxvZ3NUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCBcIkxpZmVHdWFyZEF1ZGl0TG9nc1RhYmxlXCIsIHtcbiAgICAgIHRhYmxlTmFtZTogXCJsaWZlZ3VhcmRfYXVkaXRfbG9nc1wiLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6IFwiaWRcIiwgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXG4gICAgICBlbmNyeXB0aW9uS2V5LFxuICAgIH0pO1xuXG4gICAgY29uc3QgYXV0aFRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsIFwiTGlmZUd1YXJkR29vZ2xlQXV0aFRhYmxlXCIsIHtcbiAgICAgIHRhYmxlTmFtZTogXCJsaWZlZ3VhcmRfZ29vZ2xlX2F1dGhcIixcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiBcImlkXCIsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5DVVNUT01FUl9NQU5BR0VELFxuICAgICAgZW5jcnlwdGlvbktleSxcbiAgICB9KTtcblxuICAgIC8vIDMuIEFtYXpvbiBDb2duaXRvIFVzZXIgUG9vbCBmb3IgSWRlbnRpdHlcbiAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsIFwiTGlmZUd1YXJkVXNlclBvb2xcIiwge1xuICAgICAgdXNlclBvb2xOYW1lOiBcImxpZmVndWFyZC11c2VyLXBvb2xcIixcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLFxuICAgICAgc2lnbkluQWxpYXNlczogeyBlbWFpbDogdHJ1ZSB9LFxuICAgICAgYXV0b1ZlcmlmeTogeyBlbWFpbDogdHJ1ZSB9LFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJQb29sQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgXCJMaWZlR3VhcmRVc2VyUG9vbENsaWVudFwiLCB7XG4gICAgICB1c2VyUG9vbCxcbiAgICAgIHVzZXJQb29sQ2xpZW50TmFtZTogXCJsaWZlZ3VhcmQtd2ViLWNsaWVudFwiLFxuICAgICAgZ2VuZXJhdGVTZWNyZXQ6IGZhbHNlLFxuICAgICAgYXV0aEZsb3dzOiB7XG4gICAgICAgIHVzZXJTcnA6IHRydWUsXG4gICAgICAgIGN1c3RvbTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBvQXV0aDoge1xuICAgICAgICBmbG93czogeyBhdXRob3JpemF0aW9uQ29kZUdyYW50OiB0cnVlIH0sXG4gICAgICAgIHNjb3BlczogW2NvZ25pdG8uT0F1dGhTY29wZS5FTUFJTCwgY29nbml0by5PQXV0aFNjb3BlLk9QRU5JRCwgY29nbml0by5PQXV0aFNjb3BlLlBST0ZJTEVdLFxuICAgICAgICBjYWxsYmFja1VybHM6IFtcImh0dHA6Ly9sb2NhbGhvc3Q6NTE3My9jYWxsYmFja1wiLCBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMi9hcGkvYXV0aC9nb29nbGUvY2FsbGJhY2tcIl0sXG4gICAgICAgIGxvZ291dFVybHM6IFtcImh0dHA6Ly9sb2NhbGhvc3Q6NTE3My9cIl0sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gNC4gTGFtYmRhIEhhbmRsZXIgZm9yIEJhY2tlbmQgU2VydmVyICYgQmVkcm9jayBBZ2VudCBMb29wXG4gICAgY29uc3QgYXBpTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcIkxpZmVHdWFyZEFwaUxhbWJkYVwiLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IFwibGlmZWd1YXJkLWJhY2tlbmQtYXBpXCIsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGFyY2hpdGVjdHVyZTogbGFtYmRhLkFyY2hpdGVjdHVyZS5BUk1fNjQsIC8vIENoZWFwZXIgcGF5LXBlci11c2VcbiAgICAgIGhhbmRsZXI6IFwic2VydmVyLmhhbmRsZXJcIixcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uLy4uL2JhY2tlbmQvZGlzdFwiKSksXG4gICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBVU0VfRFlOQU1PREI6IFwidHJ1ZVwiLFxuICAgICAgICBLTVNfS0VZX0lEOiBlbmNyeXB0aW9uS2V5LmtleUlkLFxuICAgICAgICBDT0dOSVRPX1VTRVJfUE9PTF9JRDogdXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgICAgQ09HTklUT19DTElFTlRfSUQ6IHVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICAgIERZTkFNT19SSVNLU19UQUJMRTogcmlza3NUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIERZTkFNT19BQ1RJT05TX1RBQkxFOiBhY3Rpb25zVGFibGUudGFibGVOYW1lLFxuICAgICAgICBEWU5BTU9fTE9HU19UQUJMRTogbG9nc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgRFlOQU1PX0FVVEhfVEFCTEU6IGF1dGhUYWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgTGFtYmRhIHBlcm1pc3Npb25zIHRvIER5bmFtb0RCLCBLTVMsIGFuZCBCZWRyb2NrIENvbnZlcnNlIEFQSVxuICAgIHJpc2tzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGFwaUxhbWJkYSk7XG4gICAgYWN0aW9uc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShhcGlMYW1iZGEpO1xuICAgIGxvZ3NUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYXBpTGFtYmRhKTtcbiAgICBhdXRoVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGFwaUxhbWJkYSk7XG4gICAgZW5jcnlwdGlvbktleS5ncmFudEVuY3J5cHREZWNyeXB0KGFwaUxhbWJkYSk7XG5cbiAgICBhcGlMYW1iZGEuYWRkVG9Sb2xlUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgXCJiZWRyb2NrOkludm9rZU1vZGVsXCIsXG4gICAgICAgICAgXCJiZWRyb2NrOkludm9rZU1vZGVsV2l0aFJlc3BvbnNlU3RyZWFtXCIsXG4gICAgICAgICAgXCJiZWRyb2NrOkNvbnZlcnNlXCIsXG4gICAgICAgICAgXCJiZWRyb2NrOkNvbnZlcnNlU3RyZWFtXCIsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogW1wiKlwiXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIDUuIEFQSSBHYXRld2F5IFJlc3QgQVBJXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhUmVzdEFwaSh0aGlzLCBcIkxpZmVHdWFyZFJlc3RBcGlcIiwge1xuICAgICAgaGFuZGxlcjogYXBpTGFtYmRhLFxuICAgICAgcHJveHk6IHRydWUsXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IFtcIkF1dGhvcml6YXRpb25cIiwgXCJDb250ZW50LVR5cGVcIl0sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gNi4gQVdTIEJ1ZGdldHMgQWxhcm0gKCQxMCBDb3N0IEd1YXJkKVxuICAgIG5ldyBidWRnZXRzLkNmbkJ1ZGdldCh0aGlzLCBcIkxpZmVHdWFyZENvc3RCdWRnZXRcIiwge1xuICAgICAgYnVkZ2V0OiB7XG4gICAgICAgIGJ1ZGdldE5hbWU6IFwibGlmZWd1YXJkLW1vbnRobHktYnVkZ2V0XCIsXG4gICAgICAgIGJ1ZGdldFR5cGU6IFwiQ09TVFwiLFxuICAgICAgICB0aW1lVW5pdDogXCJNT05USExZXCIsXG4gICAgICAgIGJ1ZGdldExpbWl0OiB7XG4gICAgICAgICAgYW1vdW50OiAxMCxcbiAgICAgICAgICB1bml0OiBcIlVTRFwiLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG5vdGlmaWNhdGlvbnNXaXRoU3Vic2NyaWJlcnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIG5vdGlmaWNhdGlvbjoge1xuICAgICAgICAgICAgbm90aWZpY2F0aW9uVHlwZTogXCJBQ1RVQUxcIixcbiAgICAgICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogXCJHUkVBVEVSX1RIQU5cIixcbiAgICAgICAgICAgIHRocmVzaG9sZDogODAsXG4gICAgICAgICAgICB0aHJlc2hvbGRUeXBlOiBcIlBFUkNFTlRBR0VcIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN1YnNjcmliZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHN1YnNjcmlwdGlvblR5cGU6IFwiRU1BSUxcIixcbiAgICAgICAgICAgICAgYWRkcmVzczogXCJhZG1pbkBsaWZlZ3VhcmQuYWlcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJBcGlVcmxcIiwgeyB2YWx1ZTogYXBpLnVybCB8fCBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMlwiIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiVXNlclBvb2xJZFwiLCB7IHZhbHVlOiB1c2VyUG9vbC51c2VyUG9vbElkIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiVXNlclBvb2xDbGllbnRJZFwiLCB7IHZhbHVlOiB1c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiS21zS2V5SWRcIiwgeyB2YWx1ZTogZW5jcnlwdGlvbktleS5rZXlJZCB9KTtcbiAgfVxufVxuIl19