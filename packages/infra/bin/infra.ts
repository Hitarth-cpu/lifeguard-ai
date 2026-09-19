#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { LifeGuardStack } from "../lib/lifeguard-stack";

const app = new cdk.App();
new LifeGuardStack(app, "LifeGuardStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID || "123456789012",
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || "us-east-1",
  },
  description: "LifeGuard Proactive Risk Sentinel - AWS Cloud Serverless Infrastructure",
});
