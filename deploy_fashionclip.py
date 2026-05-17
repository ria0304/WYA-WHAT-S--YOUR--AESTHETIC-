import boto3
import time
import json

REGION = "ap-south-1"
ROLE_ARN = "arn:aws:iam::554615221440:role/wya-sagemaker-role"
MODEL_NAME = "wya-fashionclip-model"
ENDPOINT_CONFIG_NAME = "wya-fashionclip-realtime-config"  # Updated name
ENDPOINT_NAME = "wya-fashionclip-realtime"  # Updated name

# HuggingFace DLC image for ap-south-1
IMAGE_URI = (
    "763104351884.dkr.ecr.ap-south-1.amazonaws.com/"
    "huggingface-pytorch-inference:2.1.0-transformers4.37.0-cpu-py310-ubuntu22.04"
)

client = boto3.client("sagemaker", region_name=REGION)


def delete_if_exists():
    """Clean up any existing resources before deploying."""
    print("Cleaning up old resources...")

    # Clean up both serverless and realtime endpoints
    for endpoint_name in [ENDPOINT_NAME, "wya-fashionclip-serverless"]:
        try:
            client.delete_endpoint(EndpointName=endpoint_name)
            print(f"  Deleting endpoint {endpoint_name}...")
            waiter = client.get_waiter("endpoint_deleted")
            waiter.wait(EndpointName=endpoint_name, WaiterConfig={"Delay": 15, "MaxAttempts": 40})
            print(f"  Endpoint {endpoint_name} deleted.")
        except Exception:
            print(f"  No existing endpoint: {endpoint_name}")

    # Clean up both config names
    for config_name in [ENDPOINT_CONFIG_NAME, "wya-fashionclip-config"]:
        try:
            client.delete_endpoint_config(EndpointConfigName=config_name)
            print(f"  Endpoint config {config_name} deleted.")
        except Exception:
            print(f"  No existing endpoint config: {config_name}")

    try:
        client.delete_model(ModelName=MODEL_NAME)
        print("  Model deleted.")
    except Exception:
        print("  No existing model.")

    print("Cleanup done.\n")


def create_model():
    print(f"Creating model: {MODEL_NAME}")
    client.create_model(
        ModelName=MODEL_NAME,
        PrimaryContainer={
            "Image": IMAGE_URI,
            "Environment": {
                "HF_MODEL_ID": "patrickjohncyh/fashion-clip",
                "HF_TASK": "zero-shot-image-classification",
                "SAGEMAKER_CONTAINER_LOG_LEVEL": "20",
                "SAGEMAKER_REGION": REGION,
            },
        },
        ExecutionRoleArn=ROLE_ARN,
    )
    print("Model created.\n")


def create_endpoint_config():
    print(f"Creating REAL-TIME endpoint config: {ENDPOINT_CONFIG_NAME}")
    client.create_endpoint_config(
        EndpointConfigName=ENDPOINT_CONFIG_NAME,
        ProductionVariants=[
            {
                "VariantName": "AllTraffic",
                "ModelName": MODEL_NAME,
                "InstanceType": "ml.m5.xlarge",  # 16GB RAM - enough for FashionCLIP
                "InitialInstanceCount": 1,
                "VolumeSizeInGB": 30,  # Extra storage for model
                "ModelDataDownloadTimeoutInSeconds": 1800,  # 30 minutes
                "ContainerStartupHealthCheckTimeoutInSeconds": 1800,  # 30 minutes
            }
        ],
    )
    print("Real-time endpoint config created.\n")


def create_endpoint():
    print(f"Deploying REAL-TIME endpoint: {ENDPOINT_NAME}")
    print("This will take 5-10 minutes...\n")
    client.create_endpoint(
        EndpointName=ENDPOINT_NAME,
        EndpointConfigName=ENDPOINT_CONFIG_NAME,
    )
    
    print("Waiting for endpoint to be in service...")
    waiter = client.get_waiter("endpoint_in_service")
    waiter.wait(
        EndpointName=ENDPOINT_NAME,
        WaiterConfig={"Delay": 30, "MaxAttempts": 40},
    )
    print(f"\n Real-time endpoint is live: {ENDPOINT_NAME}")


def test_endpoint():
    """Test the endpoint with FashionCLIP format."""
    print("\nTesting endpoint...")
    runtime = boto3.client("sagemaker-runtime", region_name=REGION)
    
    # Test payload for FashionCLIP
    payload = {
        "inputs": "a photo of a red dress",
        "parameters": {
            "candidate_labels": ["dress", "top", "pants", "skirt", "jacket", "shoes"]
        }
    }
    
    try:
        response = runtime.invoke_endpoint(
            EndpointName=ENDPOINT_NAME,
            ContentType="application/json",
            Body=json.dumps(payload),
        )
        result = json.loads(response["Body"].read())
        print(f"Test response: {result}")
        print(" Real-time endpoint is working with sufficient memory!")
        return True
    except Exception as e:
        print(f" Test failed: {e}")
        return False


def get_endpoint_info():
    """Display endpoint information."""
    try:
        response = client.describe_endpoint(EndpointName=ENDPOINT_NAME)
        print(f"\n Endpoint Information:")
        print(f"   Name: {response['EndpointName']}")
        print(f"   Status: {response['EndpointStatus']}")
        print(f"   Instance Type: ml.m5.xlarge (16GB RAM)")
        print(f"   Creation Time: {response['CreationTime']}")
        print(f"   ARN: {response['EndpointArn']}")
    except Exception as e:
        print(f"Could not get endpoint info: {e}")


if __name__ == "__main__":
    print(" Deploying FashionCLIP to SageMaker Real-Time Endpoint")
    print("=" * 60)
    
    delete_if_exists()
    create_model()
    create_endpoint_config()
    create_endpoint()
    
    if test_endpoint():
        get_endpoint_info()
        print("\n Deployment successful!")
        print(f"   Endpoint Name: {ENDPOINT_NAME}")
        print(f"   Region: {REGION}")
        print("   Ready for your FastAPI integration!")
    else:
        print("\n Deployment completed but test failed. Check logs.")
