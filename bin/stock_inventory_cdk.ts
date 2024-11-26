#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StockInventoryCdkStack } from '../lib/stock_inventory_cdk-stack';
import * as dotenv from 'dotenv';
dotenv.config()

const app = new cdk.App();

new StockInventoryCdkStack(app, 'StockInventoryCdkStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});
