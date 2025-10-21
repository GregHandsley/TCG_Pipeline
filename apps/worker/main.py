import time

if __name__ == "__main__":
    print("Worker container is running (placeholder).")
    try:
        while True:
            time.sleep(10)
    except KeyboardInterrupt:
        print("Worker shutting down.")