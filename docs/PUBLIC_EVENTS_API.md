# Public Events API Documentation

## Overview
This API allows external systems to fetch cemetery events for notification purposes.

## Authentication
All requests require an API key in the header:
```
x-api-key: your-api-key-here
```

## Endpoint
```
GET /api/public/events
```

## Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `category` | string | Filter by event category | `MEMORIAL`, `ALL_SOULS`, `UNDAS`, `MAINTENANCE`, `OTHER` |
| `startDate` | ISO date | Events on or after this date | `2026-01-30` |
| `endDate` | ISO date | Events on or before this date | `2026-12-31` |
| `upcoming` | boolean | Only future events | `true` |
| `limit` | number | Max events to return (default: 100) | `50` |

## Example Requests

### Get all upcoming events
```bash
curl -H "x-api-key: your-api-key" \
  "https://your-domain.com/api/public/events?upcoming=true"
```

### Get events in date range
```bash
curl -H "x-api-key: your-api-key" \
  "https://your-domain.com/api/public/events?startDate=2026-01-30&endDate=2026-02-28"
```

### Get memorial services only
```bash
curl -H "x-api-key: your-api-key" \
  "https://your-domain.com/api/public/events?category=MEMORIAL&upcoming=true"
```

### JavaScript/Node.js Example
```javascript
const apiKey = 'your-api-key';
const response = await fetch('https://your-domain.com/api/public/events?upcoming=true', {
  headers: {
    'x-api-key': apiKey
  }
});
const data = await response.json();
console.log(data.events);
```

### Python Example
```python
import requests

api_key = 'your-api-key'
headers = {'x-api-key': api_key}
response = requests.get(
    'https://your-domain.com/api/public/events?upcoming=true',
    headers=headers
)
events = response.json()['events']
```

### PHP Example
```php
<?php
$apiKey = 'your-api-key';
$url = 'https://your-domain.com/api/public/events?upcoming=true';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: ' . $apiKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    $events = $data['events'];
    
    foreach ($events as $event) {
        echo $event['title'] . " - " . $event['eventDate'] . "\n";
    }
} else {
    echo "Error: " . $httpCode . "\n";
}
?>
```

### PHP with Guzzle (Modern approach)
```php
<?php
require 'vendor/autoload.php';

use GuzzleHttp\Client;

$client = new Client();
$apiKey = 'your-api-key';

try {
    $response = $client->request('GET', 'https://your-domain.com/api/public/events', [
        'headers' => [
            'x-api-key' => $apiKey
        ],
        'query' => [
            'upcoming' => 'true',
            'limit' => 50
        ]
    ]);
    
    $data = json_decode($response->getBody(), true);
    $events = $data['events'];
    
    foreach ($events as $event) {
        echo "{$event['notificationTitle']}\n";
        echo "{$event['notificationBody']}\n\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
```

## Response Format

```json
{
  "success": true,
  "count": 2,
  "events": [
    {
      "id": "uuid",
      "title": "All Souls Day Mass",
      "description": "Annual memorial service for departed souls",
      "eventDate": "2026-11-02T08:00:00.000Z",
      "location": "Novaliches Cemetery Chapel",
      "category": "ALL_SOULS",
      "notificationTitle": "Cemetery Event: All Souls Day Mass",
      "notificationBody": "Annual memorial service for departed souls - Novaliches Cemetery Chapel on 11/2/2026",
      "daysUntilEvent": 276
    }
  ],
  "metadata": {
    "generatedAt": "2026-01-30T12:00:00.000Z",
    "filters": {
      "category": "all",
      "startDate": null,
      "endDate": null,
      "upcoming": true
    }
  }
}
```

## Notification Integration

### Using the Response for Notifications

The API provides notification-ready fields:
- `notificationTitle`: Pre-formatted title for push notifications
- `notificationBody`: Pre-formatted message body
- `daysUntilEvent`: Days until event (useful for scheduling reminders)

### Example: Schedule Notifications
```javascript
const response = await fetch('https://your-domain.com/api/public/events?upcoming=true', {
  headers: { 'x-api-key': apiKey }
});
const { events } = await response.json();

events.forEach(event => {
  // Schedule notification 3 days before event
  if (event.daysUntilEvent === 3) {
    sendNotification({
      title: event.notificationTitle,
      body: event.notificationBody,
      scheduledTime: new Date(event.eventDate)
    });
  }
});
```

### PHP Example: Send SMS Notifications
```php
<?php
// Fetch upcoming events
$apiKey = 'your-api-key';
$url = 'https://your-domain.com/api/public/events?upcoming=true&limit=10';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['x-api-key: ' . $apiKey]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$events = $data['events'];

// Send notifications for events in next 7 days
foreach ($events as $event) {
    if ($event['daysUntilEvent'] <= 7 && $event['daysUntilEvent'] > 0) {
        // Using Twilio, Semaphore, or your SMS provider
        sendSMS([
            'to' => $userPhoneNumber,
            'message' => $event['notificationBody']
        ]);
    }
}

function sendSMS($data) {
    // Your SMS provider integration
    // Example: Semaphore API
    $smsApiKey = 'your-sms-api-key';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.semaphore.co/api/v4/messages');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'apikey' => $smsApiKey,
        'number' => $data['to'],
        'message' => $data['message']
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $result = curl_exec($ch);
    curl_close($ch);
    
    return $result;
}
?>
```

### PHP Example: Database Notification System
```php
<?php
// Fetch events and store in your database for notification scheduling
$apiKey = 'your-api-key';
$url = 'https://your-domain.com/api/public/events?upcoming=true';

// Fetch events
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['x-api-key: ' . $apiKey]);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$events = $data['events'];

// Store in your database
$pdo = new PDO('mysql:host=localhost;dbname=yourdb', 'username', 'password');

foreach ($events as $event) {
    $stmt = $pdo->prepare("
        INSERT INTO notifications (event_id, title, message, event_date, days_until, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            message = VALUES(message),
            event_date = VALUES(event_date),
            days_until = VALUES(days_until)
    ");
    
    $stmt->execute([
        $event['id'],
        $event['notificationTitle'],
        $event['notificationBody'],
        $event['eventDate'],
        $event['daysUntilEvent']
    ]);
}

echo "Synced " . count($events) . " events\n";
?>
```

### PHP Example: WordPress Plugin Integration
```php
<?php
// Add to your WordPress plugin or theme functions.php

// Schedule daily cron to fetch events
add_action('wp', function() {
    if (!wp_next_scheduled('fetch_cemetery_events')) {
        wp_schedule_event(time(), 'daily', 'fetch_cemetery_events');
    }
});

// Fetch and store events
add_action('fetch_cemetery_events', function() {
    $apiKey = get_option('cemetery_api_key');
    $url = 'https://your-domain.com/api/public/events?upcoming=true';
    
    $response = wp_remote_get($url, [
        'headers' => ['x-api-key' => $apiKey]
    ]);
    
    if (is_wp_error($response)) {
        error_log('Cemetery events fetch failed: ' . $response->get_error_message());
        return;
    }
    
    $data = json_decode(wp_remote_retrieve_body($response), true);
    $events = $data['events'];
    
    // Store as custom post type or update option
    update_option('cemetery_upcoming_events', $events);
    
    // Send email notifications for events in next 7 days
    foreach ($events as $event) {
        if ($event['daysUntilEvent'] <= 7 && $event['daysUntilEvent'] > 0) {
            $subscribers = get_users(['role' => 'subscriber']);
            foreach ($subscribers as $user) {
                wp_mail(
                    $user->user_email,
                    $event['notificationTitle'],
                    $event['notificationBody']
                );
            }
        }
    }
});

// Display events in shortcode [cemetery_events]
add_shortcode('cemetery_events', function() {
    $events = get_option('cemetery_upcoming_events', []);
    
    if (empty($events)) {
        return '<p>No upcoming events</p>';
    }
    
    $html = '<div class="cemetery-events">';
    foreach ($events as $event) {
        $html .= sprintf(
            '<div class="event"><h3>%s</h3><p>%s</p><p><strong>%s</strong> - %s</p></div>',
            esc_html($event['title']),
            esc_html($event['description']),
            date('F j, Y', strtotime($event['eventDate'])),
            esc_html($event['location'])
        );
    }
    $html .= '</div>';
    
    return $html;
});
?>
```

### Example: Firebase Cloud Messaging (FCM)
```javascript
const admin = require('firebase-admin');

async function sendEventNotifications() {
  const response = await fetch('https://your-domain.com/api/public/events?upcoming=true&limit=10', {
    headers: { 'x-api-key': process.env.API_KEY }
  });
  const { events } = await response.json();

  for (const event of events) {
    // Send notification for events in next 7 days
    if (event.daysUntilEvent <= 7 && event.daysUntilEvent > 0) {
      await admin.messaging().send({
        topic: 'cemetery-events',
        notification: {
          title: event.notificationTitle,
          body: event.notificationBody
        },
        data: {
          eventId: event.id,
          eventDate: event.eventDate,
          location: event.location
        }
      });
    }
  }
}
```

## Event Categories

| Category | Description |
|----------|-------------|
| `MEMORIAL` | Memorial services and commemorations |
| `ALL_SOULS` | All Souls Day events (November 2) |
| `UNDAS` | All Saints Day / Undas (November 1) |
| `MAINTENANCE` | Cemetery maintenance schedules |
| `OTHER` | Other cemetery-related events |

## Rate Limiting
- No rate limit currently implemented
- API key usage is tracked with `lastUsedAt` timestamp

## Error Responses

### 401 Unauthorized
```json
{
  "error": "API key is required. Include 'x-api-key' header."
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or inactive API key"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Obtaining an API Key

Contact the cemetery system administrator to request an API key. Keys are managed through the admin dashboard at:
```
/admin/api-keys
```

## Best Practices

1. **Cache responses**: Cache event data for at least 1 hour to reduce API calls
2. **Schedule checks**: Poll for events daily or when needed, not on every user interaction
3. **Filter appropriately**: Use `upcoming=true` and date ranges to get only relevant events
4. **Handle errors**: Implement retry logic for failed requests
5. **Secure API keys**: Store API keys in environment variables, never in code

## Support

For API support or to report issues, contact the system administrator.
