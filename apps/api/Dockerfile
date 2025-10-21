FROM python:3.11-slim

# System deps (optional but keeps builds fast/stable)
RUN pip install --no-cache-dir --upgrade pip

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Dev-friendly: reload enabled; good for compose volume mounts
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8000","--reload"]