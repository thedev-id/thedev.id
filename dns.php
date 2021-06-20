<?php

require 'vendor/autoload.php';

use Mailgun\Mailgun;

// set variables
$email   = getenv('CF_EMAIL');
$apiKey  = getenv('CF_API_KEY');
$zoneID  = getenv('CF_ZONE_ID');
$mailgunDomain = getenv('MG_DOMAIN');
$mailgunKey = getenv('MG_KEY');
$mailFrom = getenv('MAIL_FROM');
$mailTo  = getenv('MAIL_TO');

// instantiation
$key     = new Cloudflare\API\Auth\APIKey($email, $apiKey);
$adapter = new Cloudflare\API\Adapter\Guzzle($key);
$dns     = new Cloudflare\API\Endpoints\DNS($adapter);
$mg      = Mailgun::create($mailgunKey);

// get subdomains
$json    = file_get_contents('./subdomains.json');
$data    = json_decode($json, true);

function send_mail($subject, $text) {
  global $mg;
  $mg->messages()->send($mailgunDomain, [
    'from'    => $mailFrom,
    'to'      => $mailTo,
    'subject' => $subject,
    'text'    => $text
  ]);
}

function get_status($url) {
  $ch = curl_init();

  curl_setopt_array($ch, [
    CURLOPT_URL            => $url,
    CURLOPT_NOBODY         => 1,
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_HEADER         => 1,
    CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
    CURLOPT_SSL_VERIFYHOST => 0,
    CURLOPT_USERAGENT      => 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36 thedev.id-status-check',
  ]);

  $response = curl_exec($ch);
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

  curl_close($ch);

  return $status;
}

foreach ($data as $subdomain => $cname) {
  $domain = $subdomain . '.thedev.id';
  $recordID = $dns->getRecordID($zoneID, 'CNAME', $domain);
  $updatedRecord = [
    'type' => 'CNAME',
    'name' => $domain,
    'content' => $cname,
    'ttl' => 0,
    'proxied' => false
  ];
  $status = get_status("https://$domain/");

  // get & check record ID
  if ($recordID == true) {
    echo "The subdomain $domain already exist.\n";
    // if record exist, update content
    if ($dns->updateRecordDetails($zoneID, $recordID, $updatedRecord) == true) {
      echo "Updated the subdomain $domain with new content $cname.\n";
      
      if ($status != '200') {
        echo "Status for $domain is $status.\n";
        send_mail("$domain is not configured properly!", "Please check if the domain $domain is still valid before removing it from the list.");
      }
    }
  } else {
    // add new CNAME record
    if ($dns->addRecord($zoneID, "CNAME", $subdomain, $cname, 0, false) === true) {
      echo "A new CNAME record created for $domain.\n";
    }
  }
}
