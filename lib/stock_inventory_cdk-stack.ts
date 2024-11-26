import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';

export class StockInventoryCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* PART 1 */
    const inventoryBucket = new cdk.aws_s3.Bucket(this, 'Inventory-74621', {
      bucketName: 'inventory-74621',
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const inventoryTable = new cdk.aws_dynamodb.Table(this, 'Inventory', {
      tableName: 'Inventory',
      partitionKey: { name: 'Store', type: cdk.aws_dynamodb.AttributeType.STRING },
      stream: cdk.aws_dynamodb.StreamViewType.NEW_IMAGE,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const loadInventoryFunction = new cdk.aws_lambda.Function(this, 'LoadInventoryFunction', {
      functionName: 'LoadInventoryFunction',
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_9,
      handler: 'loadInventory.lambda_handler',
      code: cdk.aws_lambda.Code.fromAsset(join(__dirname, '..', 'lambda')),
      initialPolicy: [
        new cdk.aws_iam.PolicyStatement({
          effect: cdk.aws_iam.Effect.ALLOW,
          actions: ['dynamodb:*'],
          resources: [inventoryTable.tableArn],
        }),
      ],
    });

    inventoryBucket.grantRead(loadInventoryFunction)

    inventoryBucket.addEventNotification(
      cdk.aws_s3.EventType.OBJECT_CREATED,
      new cdk.aws_s3_notifications.LambdaDestination(loadInventoryFunction)
    );

    /* PART 2 */
    const noStockTopic = new cdk.aws_sns.Topic(this, 'NoStock', {
      topicName: 'NoStock',
    });

    const emailAddress = process.env.EMAIL_ADDRESS!
    noStockTopic.addSubscription(new cdk.aws_sns_subscriptions.EmailSubscription(emailAddress));
    
    const checkInventoryFunction = new cdk.aws_lambda.Function(this, 'CheckInventoryFunction', {
      functionName: 'CheckInventoryFunction',
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_9,
      handler: 'checkInventory.lambda_handler',
      code: cdk.aws_lambda.Code.fromAsset(join(__dirname, '..', 'lambda')),
      environment: {
        TOPIC_ARN: noStockTopic.topicArn,
      },
      initialPolicy: [
        new cdk.aws_iam.PolicyStatement({
          effect: cdk.aws_iam.Effect.ALLOW,
          actions: ['sns:*'],
          resources: [noStockTopic.topicArn],
        }),
      ],
    });

    inventoryTable.grantStreamRead(checkInventoryFunction);

    checkInventoryFunction.addEventSourceMapping('InventoryStream', {
      eventSourceArn: inventoryTable.tableStreamArn!,
      startingPosition: cdk.aws_lambda.StartingPosition.LATEST,
    });
  }
}
