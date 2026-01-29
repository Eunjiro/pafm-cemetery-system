# PHP Integration Guide - Cemetery Events API

## Quick Start Guide for PHP Developers

This guide will help you integrate cemetery events into your PHP website or system.

---

## Step 1: Get Your API Key

1. Contact your cemetery system administrator
2. They will generate an API key for you at: `/admin/api-keys`
3. Save the API key securely - it looks like: `pafm_abc123def456...`

---

## Step 2: Basic PHP Integration

### Option A: Simple PHP Script (No Dependencies)

Save this as `fetch_events.php`:

```php
<?php
// Configuration
$API_KEY = 'your-api-key-here'; // Replace with your actual API key
$API_URL = 'https://your-cemetery-system.com/api/public/events';

function fetchCemeteryEvents($apiKey, $apiUrl, $params = []) {
    // Build query string
    $queryString = http_build_query($params);
    $url = $queryString ? $apiUrl . '?' . $queryString : $apiUrl;
    
    // Initialize cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-api-key: ' . $apiKey
    ]);
    
    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    // Handle errors
    if ($error) {
        return ['error' => 'Connection error: ' . $error];
    }
    
    if ($httpCode !== 200) {
        return ['error' => 'API returned error code: ' . $httpCode];
    }
    
    // Parse JSON response
    return json_decode($response, true);
}

// Fetch upcoming events
$result = fetchCemeteryEvents($API_KEY, $API_URL, [
    'upcoming' => 'true',
    'limit' => 10
]);

if (isset($result['error'])) {
    die('Error: ' . $result['error']);
}

$events = $result['events'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cemetery Events</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .event-card { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
        .event-title { font-size: 24px; font-weight: bold; color: #333; }
        .event-date { color: #666; margin: 10px 0; }
        .event-location { color: #888; }
        .event-description { margin-top: 10px; line-height: 1.6; }
        .badge { display: inline-block; padding: 4px 12px; background: #007bff; color: white; border-radius: 4px; font-size: 12px; }
    </style>
</head>
<body>
    <h1>Upcoming Cemetery Events</h1>
    
    <?php if (empty($events)): ?>
        <p>No upcoming events at this time.</p>
    <?php else: ?>
        <?php foreach ($events as $event): ?>
            <div class="event-card">
                <div class="event-title"><?= htmlspecialchars($event['title']) ?></div>
                <div class="event-date">
                    📅 <?= date('F j, Y', strtotime($event['eventDate'])) ?>
                    <?php if ($event['daysUntilEvent'] > 0): ?>
                        <span class="badge"><?= $event['daysUntilEvent'] ?> days away</span>
                    <?php endif; ?>
                </div>
                <div class="event-location">
                    📍 <?= htmlspecialchars($event['location']) ?>
                </div>
                <div class="event-description">
                    <?= htmlspecialchars($event['description']) ?>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</body>
</html>
```

### Option B: WordPress Integration

Add this to your theme's `functions.php`:

```php
<?php
// Cemetery Events Configuration
define('CEMETERY_API_KEY', 'your-api-key-here');
define('CEMETERY_API_URL', 'https://your-cemetery-system.com/api/public/events');

// Fetch and cache events
function get_cemetery_events($params = []) {
    $cache_key = 'cemetery_events_' . md5(serialize($params));
    
    // Check cache (1 hour)
    $cached = get_transient($cache_key);
    if ($cached !== false) {
        return $cached;
    }
    
    // Fetch from API
    $queryString = http_build_query(array_merge([
        'upcoming' => 'true',
        'limit' => 20
    ], $params));
    
    $response = wp_remote_get(CEMETERY_API_URL . '?' . $queryString, [
        'headers' => [
            'x-api-key' => CEMETERY_API_KEY
        ],
        'timeout' => 15
    ]);
    
    if (is_wp_error($response)) {
        error_log('Cemetery API Error: ' . $response->get_error_message());
        return [];
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    $events = isset($data['events']) ? $data['events'] : [];
    
    // Cache for 1 hour
    set_transient($cache_key, $events, HOUR_IN_SECONDS);
    
    return $events;
}

// Shortcode: [cemetery_events]
add_shortcode('cemetery_events', function($atts) {
    $atts = shortcode_atts([
        'limit' => 10,
        'category' => ''
    ], $atts);
    
    $params = ['limit' => $atts['limit']];
    if (!empty($atts['category'])) {
        $params['category'] = $atts['category'];
    }
    
    $events = get_cemetery_events($params);
    
    if (empty($events)) {
        return '<p>No upcoming events at this time.</p>';
    }
    
    ob_start();
    ?>
    <div class="cemetery-events">
        <?php foreach ($events as $event): ?>
            <div class="cemetery-event-card">
                <h3><?= esc_html($event['title']) ?></h3>
                <p class="event-meta">
                    <span class="event-date">📅 <?= date('F j, Y', strtotime($event['eventDate'])) ?></span>
                    <span class="event-location">📍 <?= esc_html($event['location']) ?></span>
                </p>
                <p class="event-description"><?= esc_html($event['description']) ?></p>
                <?php if ($event['daysUntilEvent'] > 0 && $event['daysUntilEvent'] <= 7): ?>
                    <span class="event-soon">Coming up in <?= $event['daysUntilEvent'] ?> days!</span>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>
    </div>
    <?php
    return ob_get_clean();
});

// Widget: Cemetery Events
class Cemetery_Events_Widget extends WP_Widget {
    public function __construct() {
        parent::__construct(
            'cemetery_events_widget',
            'Cemetery Events',
            ['description' => 'Display upcoming cemetery events']
        );
    }
    
    public function widget($args, $instance) {
        echo $args['before_widget'];
        echo $args['before_title'] . 'Upcoming Events' . $args['after_title'];
        
        $events = get_cemetery_events(['limit' => 5]);
        
        if (!empty($events)) {
            echo '<ul class="cemetery-events-widget">';
            foreach ($events as $event) {
                printf(
                    '<li><strong>%s</strong><br><small>%s - %s</small></li>',
                    esc_html($event['title']),
                    date('M j', strtotime($event['eventDate'])),
                    esc_html($event['location'])
                );
            }
            echo '</ul>';
        } else {
            echo '<p>No upcoming events</p>';
        }
        
        echo $args['after_widget'];
    }
}

add_action('widgets_init', function() {
    register_widget('Cemetery_Events_Widget');
});

// Daily cron to clear cache
add_action('wp', function() {
    if (!wp_next_scheduled('cemetery_events_cache_clear')) {
        wp_schedule_event(time(), 'daily', 'cemetery_events_cache_clear');
    }
});

add_action('cemetery_events_cache_clear', function() {
    delete_transient('cemetery_events_*');
});
?>
```

**Usage in WordPress:**
- Shortcode in posts/pages: `[cemetery_events]`
- Shortcode with limit: `[cemetery_events limit="5"]`
- Shortcode with category: `[cemetery_events category="MEMORIAL"]`
- Widget: Add "Cemetery Events" widget to sidebar

### Option C: Laravel/Modern PHP Framework

```php
<?php
// app/Services/CemeteryApiService.php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class CemeteryApiService
{
    private $apiKey;
    private $apiUrl;
    
    public function __construct()
    {
        $this->apiKey = config('services.cemetery.api_key');
        $this->apiUrl = config('services.cemetery.api_url');
    }
    
    public function getEvents($params = [])
    {
        $cacheKey = 'cemetery_events_' . md5(json_encode($params));
        
        return Cache::remember($cacheKey, 3600, function() use ($params) {
            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey
            ])->get($this->apiUrl, $params);
            
            if ($response->successful()) {
                return $response->json()['events'] ?? [];
            }
            
            return [];
        });
    }
    
    public function getUpcomingEvents($limit = 10)
    {
        return $this->getEvents([
            'upcoming' => 'true',
            'limit' => $limit
        ]);
    }
}

// config/services.php
return [
    'cemetery' => [
        'api_key' => env('CEMETERY_API_KEY'),
        'api_url' => env('CEMETERY_API_URL', 'https://cemetery.example.com/api/public/events'),
    ],
];

// routes/web.php
Route::get('/events', function (CemeteryApiService $cemetery) {
    $events = $cemetery->getUpcomingEvents();
    return view('events.index', compact('events'));
});
```

---

## Step 3: Display Events on Your Website

### Simple HTML/CSS Display

```php
<?php
$events = fetchCemeteryEvents($API_KEY, $API_URL, ['upcoming' => 'true']);
?>

<div class="events-container">
    <h2>Upcoming Cemetery Events</h2>
    
    <?php foreach ($events['events'] as $event): ?>
        <div class="event-item">
            <div class="event-header">
                <h3><?= htmlspecialchars($event['title']) ?></h3>
                <span class="category-badge"><?= $event['category'] ?></span>
            </div>
            
            <div class="event-details">
                <div class="detail-item">
                    <strong>Date:</strong>
                    <?= date('l, F j, Y', strtotime($event['eventDate'])) ?>
                </div>
                
                <div class="detail-item">
                    <strong>Location:</strong>
                    <?= htmlspecialchars($event['location']) ?>
                </div>
                
                <div class="detail-item">
                    <strong>Description:</strong>
                    <?= htmlspecialchars($event['description']) ?>
                </div>
                
                <?php if ($event['daysUntilEvent'] <= 7 && $event['daysUntilEvent'] > 0): ?>
                    <div class="alert-upcoming">
                        ⚠️ This event is coming up in <?= $event['daysUntilEvent'] ?> days!
                    </div>
                <?php endif; ?>
            </div>
        </div>
    <?php endforeach; ?>
</div>

<style>
.events-container { max-width: 800px; margin: 20px auto; padding: 20px; }
.event-item { background: #f9f9f9; border-left: 4px solid #007bff; padding: 20px; margin-bottom: 20px; }
.event-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.category-badge { background: #007bff; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
.detail-item { margin: 10px 0; }
.alert-upcoming { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin-top: 15px; border-radius: 4px; }
</style>
```

---

## Step 4: Advanced Features

### A. Send SMS Notifications (using Semaphore)

```php
<?php
// config.php
define('CEMETERY_API_KEY', 'your-api-key');
define('CEMETERY_API_URL', 'https://cemetery.example.com/api/public/events');
define('SEMAPHORE_API_KEY', 'your-semaphore-api-key');

// Check for events in next 3 days and send SMS
function sendEventReminders() {
    $events = fetchCemeteryEvents(CEMETERY_API_KEY, CEMETERY_API_URL, [
        'upcoming' => 'true'
    ]);
    
    foreach ($events['events'] as $event) {
        // Send reminder 3 days before
        if ($event['daysUntilEvent'] == 3) {
            $message = sprintf(
                "Reminder: %s on %s at %s",
                $event['title'],
                date('M j', strtotime($event['eventDate'])),
                $event['location']
            );
            
            sendSMS($subscribers, $message);
        }
    }
}

function sendSMS($numbers, $message) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.semaphore.co/api/v4/messages');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'apikey' => SEMAPHORE_API_KEY,
        'number' => implode(',', $numbers),
        'message' => $message
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $result = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($result, true);
}

// Run daily via cron: 0 9 * * * /usr/bin/php /path/to/send_reminders.php
sendEventReminders();
?>
```

### B. Store in Database for Faster Access

```php
<?php
// sync_events.php - Run this hourly via cron
require_once 'config.php';
require_once 'db.php'; // Your database connection

function syncEvents() {
    $events = fetchCemeteryEvents(CEMETERY_API_KEY, CEMETERY_API_URL, [
        'upcoming' => 'true'
    ]);
    
    if (!isset($events['events'])) {
        return;
    }
    
    $db = getDbConnection();
    
    foreach ($events['events'] as $event) {
        $stmt = $db->prepare("
            INSERT INTO events (event_id, title, description, event_date, location, category, days_until, synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                description = VALUES(description),
                event_date = VALUES(event_date),
                location = VALUES(location),
                category = VALUES(category),
                days_until = VALUES(days_until),
                synced_at = NOW()
        ");
        
        $stmt->execute([
            $event['id'],
            $event['title'],
            $event['description'],
            $event['eventDate'],
            $event['location'],
            $event['category'],
            $event['daysUntilEvent']
        ]);
    }
    
    echo "Synced " . count($events['events']) . " events\n";
}

syncEvents();
?>
```

---

## Testing Your Integration

1. **Test API Connection:**
```php
<?php
$test = fetchCemeteryEvents('your-api-key', 'https://api-url', ['limit' => 1]);
print_r($test);
?>
```

2. **Check for Errors:**
```php
if (isset($result['error'])) {
    error_log('Cemetery API Error: ' . $result['error']);
}
```

---

## Support

For questions or issues:
1. Check your API key is correct and active
2. Verify the API URL is accessible
3. Check PHP error logs for detailed error messages
4. Contact your cemetery system administrator

---

## Security Best Practices

1. **Never commit API keys to version control**
2. **Store API keys in environment variables or config files**
3. **Use HTTPS only**
4. **Cache responses to reduce API calls**
5. **Validate and sanitize all output data**
