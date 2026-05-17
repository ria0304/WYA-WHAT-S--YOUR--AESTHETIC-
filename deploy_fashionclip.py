import boto3
import time
import json

REGION = "ap-south-1"
ROLE_ARN = "arn:aws:iam::554615221440:role/wya-sagemaker-role"
MODEL_NAME = "wya-fashionclip-model"
ENDPOINT_CONFIG_NAME = "wya-fashionclip-config"
ENDPOINT_NAME = "wya-fashionclip-serverless"

# HuggingFace DLC image for ap-south-1
IMAGE_URI = (
    "763104351884.dkr.ecr.ap-south-1.amazonaws.com/"
    "huggingface-pytorch-inference:2.1.0-transformers4.37.0-cpu-py310-ubuntu22.04"
)

client = boto3.client("sagemaker", region_name=REGION)


def delete_if_exists():
    """Clean up any existing resources before deploying."""
    print("Cleaning up old resources...")

    try:
        client.delete_endpoint(EndpointName=ENDPOINT_NAME)
        print(f"  Deleting endpoint {ENDPOINT_NAME}...")
        waiter = client.get_waiter("endpoint_deleted")
        waiter.wait(EndpointName=ENDPOINT_NAME, WaiterConfig={"Delay": 15, "MaxAttempts": 40})
        print("  Endpoint deleted.")
    except Exception:
        print("  No existing endpoint.")

    try:
        client.delete_endpoint_config(EndpointConfigName=ENDPOINT_CONFIG_NAME)
        print("  Endpoint config deleted.")
    except Exception:
        print("  No existing endpoint config.")

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
            },
        },
        ExecutionRoleArn=ROLE_ARN,
    )
    print("Model created.\n")


def create_endpoint_config():
    print(f"Creating endpoint config: {ENDPOINT_CONFIG_NAME}")
    client.create_endpoint_config(
        EndpointConfigName=ENDPOINT_CONFIG_NAME,
        ProductionVariants=[
            {
                "VariantName": "default",
                "ModelName": MODEL_NAME,
                "ServerlessConfig": {
                    "MemorySizeInMB": 2048,
                    "MaxConcurrency": 3,
                },
            }
        ],
    )
    print("Endpoint config created.\n")


def create_endpoint():
    print(f"Deploying endpoint: {ENDPOINT_NAME}")
    print("This will take 5-10 minutes...\n")
    client.create_endpoint(
        EndpointName=ENDPOINT_NAME,
        EndpointConfigName=ENDPOINT_CONFIG_NAME,
    )
    waiter = client.get_waiter("endpoint_in_service")
    waiter.wait(
        EndpointName=ENDPOINT_NAME,
        WaiterConfig={"Delay": 30, "MaxAttempts": 40},
    )
    print(f"\nEndpoint is live: {ENDPOINT_NAME}")


def test_endpoint():
    """Quick smoke test — send a dummy payload to confirm endpoint responds."""
    print("\nTesting endpoint...")
    runtime = boto3.client("sagemaker-runtime", region_name=REGION)
    payload = {
        "inputs": "a photo of a dress",
        "parameters": {
            "candidate_labels": ["dress", "top", "jeans", "shoes", "bag"]
        },
    }
    try:
        response = runtime.invoke_endpoint(
            EndpointName=ENDPOINT_NAME,
            ContentType="application/json",
            Body=json.dumps(payload),
        )
        result = json.loads(response["Body"].read())
        print(f"Test response: {result}")
        print("Endpoint is working!")
    except Exception as e:
        print(f"Test failed (endpoint may still be ok): {e}")


if __name__ == "__main__":
    delete_if_exists()
    create_model()
    create_endpoint_config()
    create_endpoint()
    test_endpoint()
