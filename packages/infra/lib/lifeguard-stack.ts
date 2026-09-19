import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as kms from "aws-cdk-lib/aws-kms";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as budgets from "aws-cdk-lib/aws-budgets";
import * as path from "path";

export class LifeGuardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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

    apiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
          "bedrock:Converse",
          "bedrock:ConverseStream",
        ],
        resources: ["*"],
      })
    );

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
