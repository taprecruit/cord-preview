# Systemd Service for Cord Preview

This directory contains the systemd service file to automatically start the Cord Preview Docker Compose application on system boot.

## Installation

1. Copy the service file to systemd directory:
```bash
sudo cp /home/ubuntu/cord-preview/ops/systemd/cord-preview.service /etc/systemd/system/
```

2. Reload systemd to recognize the new service:
```bash
sudo systemctl daemon-reload
```

3. Enable the service to start on boot:
```bash
sudo systemctl enable cord-preview.service
```

4. Start the service now (optional):
```bash
sudo systemctl start cord-preview.service
```

5. Check the status:
```bash
sudo systemctl status cord-preview.service
```

## Management Commands

### View logs
```bash
sudo journalctl -u cord-preview.service -f
```

### Stop the service
```bash
sudo systemctl stop cord-preview.service
```

### Restart the service
```bash
sudo systemctl restart cord-preview.service
```

### Disable auto-start on boot
```bash
sudo systemctl disable cord-preview.service
```

### Check if enabled
```bash
sudo systemctl is-enabled cord-preview.service
```

## Testing

After installation, you can test by rebooting the system:
```bash
sudo reboot
```

After the system comes back up, verify the containers are running:
```bash
docker compose ps
# or
docker ps
```

## Notes

- The service runs as the `ubuntu` user
- Uses `docker compose stop` instead of `down` to minimize downtime on restarts
- Containers are reused between restarts for faster startup
- The service will restart on failure with a 10-second delay
- Maximum timeout for startup is 300 seconds (5 minutes)
- The service requires Docker to be running first
