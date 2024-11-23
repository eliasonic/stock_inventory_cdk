#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StockInventoryCdkStack } from '../lib/stock_inventory_cdk-stack';

const app = new cdk.App();
new StockInventoryCdkStack(app, 'StockInventoryCdkStack');
