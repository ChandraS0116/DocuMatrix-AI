import httpx
import asyncio

async def run_seed():
    print("Initiating P4 Demo Seeder...")
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post("http://localhost:8000/api/v1/demo/seed")
            if res.status_code == 200:
                print("Seeding Successful:", res.json())
            else:
                print("Seeding Failed:", res.status_code, res.text)
        except Exception as e:
            print("Failed to reach server:", str(e))

if __name__ == "__main__":
    asyncio.run(run_seed())
