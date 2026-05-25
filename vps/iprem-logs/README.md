# iPremTvOnline VPS Log Receiver

## Installation sur le VPS 158.220.85.28

```bash
# 1. Créer le dossier web
sudo mkdir -p /var/www/html/iprem-logs
sudo cp report.php dashboard.php /var/www/html/iprem-logs/

# 2. Créer le dossier de logs (writable par Apache/Nginx)
sudo mkdir -p /var/log/iprem
sudo chown www-data:www-data /var/log/iprem
sudo chmod 755 /var/log/iprem

# 3. Définir le token d'accès au dashboard
echo 'export VPS_LOG_TOKEN="ton-token-secret-ici"' | sudo tee -a /etc/apache2/envvars
sudo systemctl reload apache2
```

## Endpoints

- **Réception** (utilisé par l'app) : `POST http://158.220.85.28/iprem-logs/report.php`
- **Dashboard** (pour toi) : `http://158.220.85.28/iprem-logs/dashboard.php?t=ton-token-secret-ici`

## Format JSON reçu

```json
{
  "severity": "CRITICAL|ERROR|WARNING|INFO",
  "message": "courte description",
  "stack": "stacktrace si dispo",
  "signature": "hash unique pour grouper les erreurs identiques",
  "timestamp": "2026-05-24T22:00:00.000Z",
  "device": {
    "ua": "Mozilla/5.0...",
    "lang": "fr-FR",
    "screen": "1920x1080",
    "app_version": "3.1.3",
    "version_code": 54,
    "device_hash": "abc123"
  },
  "context": { "url": "...", "code": 404 }
}
```

## Données stockées

- `/var/log/iprem/reports.jsonl` : un rapport JSON par ligne (append-only)
- `/var/log/iprem/index.json` : index des signatures avec count + first_seen + last_seen

## Rotation des logs

Pour éviter que ça grossisse infiniment, ajoute un cron job :

```bash
# /etc/cron.daily/iprem-rotate
#!/bin/bash
LOG_DIR=/var/log/iprem
DATE=$(date +%Y%m%d)
if [ -f "$LOG_DIR/reports.jsonl" ]; then
    mv "$LOG_DIR/reports.jsonl" "$LOG_DIR/reports-$DATE.jsonl"
    gzip "$LOG_DIR/reports-$DATE.jsonl"
fi
# Garde 30 jours d'archives
find $LOG_DIR -name 'reports-*.gz' -mtime +30 -delete
```

## Priorisation

Le dashboard trie automatiquement :
1. **Sévérité** : CRITICAL > ERROR > WARNING > INFO
2. **Fréquence** : signatures les plus fréquentes en premier (au sein d'une même sévérité)

Vincent voit donc en haut les bugs **les plus graves ET les plus courants** — les fixes prioritaires.
