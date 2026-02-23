<?php

declare(strict_types=1);

require __DIR__ . '/lib/db.php';

function html_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function truncate_text(string $value, int $max): string
{
    if ($value === '') {
        return '';
    }
    if (function_exists('mb_strlen') && function_exists('mb_substr')) {
        if (mb_strlen($value, 'UTF-8') <= $max) {
            return $value;
        }
        return rtrim(mb_substr($value, 0, $max - 1, 'UTF-8')) . '...';
    }
    if (strlen($value) <= $max) {
        return $value;
    }
    return rtrim(substr($value, 0, $max - 1)) . '...';
}

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: public, max-age=120, s-maxage=120');

$cfg = config();
$baseUrl = rtrim((string) (($cfg['app']['public_base_url'] ?? 'https://meme.altcore.fr')), '/');
$defaultTitle = 'Meme Creator';
$defaultDescription = 'Create, remix, and share memes in one click.';
$defaultImage = $baseUrl . '/logo.png';

$memeIdRaw = (string) ($_GET['id'] ?? '');
$memeId = ctype_digit($memeIdRaw) ? (int) $memeIdRaw : 0;
$memeUrl = $memeId > 0 ? $baseUrl . '/m/' . $memeId : $baseUrl . '/';

$title = $defaultTitle;
$description = $defaultDescription;
$image = $defaultImage;
$author = 'Meme Creator';
$notFound = false;

if ($memeId > 0) {
    try {
        $pdo = db();
        $stmt = $pdo->prepare(
            'SELECT m.id, m.title, m.description, m.generated_image_url, m.source_image_url, u.username
             FROM memes m
             INNER JOIN users u ON u.id = m.user_id
             WHERE m.id = :id
               AND m.is_public = 1
               AND m.moderation_status = "approved"
             LIMIT 1'
        );
        $stmt->execute([':id' => $memeId]);
        $row = $stmt->fetch();

        if ($row) {
            $rawTitle = trim((string) ($row['title'] ?? ''));
            $rawDescription = trim((string) ($row['description'] ?? ''));
            $rawAuthor = trim((string) ($row['username'] ?? ''));
            $imageCandidate = trim((string) ($row['generated_image_url'] ?? ''));
            if ($imageCandidate === '') {
                $imageCandidate = trim((string) ($row['source_image_url'] ?? ''));
            }

            $title = truncate_text($rawTitle !== '' ? $rawTitle . ' | Meme Creator' : $defaultTitle, 120);
            if ($rawDescription !== '') {
                $description = truncate_text($rawDescription, 220);
            } elseif ($rawAuthor !== '') {
                $description = truncate_text($rawAuthor . ' shared a meme on Meme Creator.', 220);
            }
            if ($rawAuthor !== '') {
                $author = $rawAuthor;
            }
            if ($imageCandidate !== '') {
                $image = $imageCandidate;
            }
        } else {
            $notFound = true;
            $title = 'Meme not found | Meme Creator';
            $description = 'This meme is unavailable or private.';
        }
    } catch (Throwable $e) {
        $notFound = true;
        $title = 'Meme unavailable | Meme Creator';
        $description = 'Unable to load meme metadata right now.';
    }
} else {
    $notFound = true;
}

if ($notFound) {
    http_response_code(404);
}
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><?php echo html_escape($title); ?></title>
    <meta name="description" content="<?php echo html_escape($description); ?>" />
    <?php if ($notFound): ?>
    <meta name="robots" content="noindex, nofollow" />
    <?php else: ?>
    <meta name="robots" content="index, follow" />
    <?php endif; ?>
    <link rel="canonical" href="<?php echo html_escape($memeUrl); ?>" />

    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Meme Creator" />
    <meta property="og:url" content="<?php echo html_escape($memeUrl); ?>" />
    <meta property="og:title" content="<?php echo html_escape($title); ?>" />
    <meta property="og:description" content="<?php echo html_escape($description); ?>" />
    <meta property="og:image" content="<?php echo html_escape($image); ?>" />
    <meta property="og:image:alt" content="<?php echo html_escape($title); ?>" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="<?php echo html_escape($title); ?>" />
    <meta name="twitter:description" content="<?php echo html_escape($description); ?>" />
    <meta name="twitter:image" content="<?php echo html_escape($image); ?>" />

    <script type="application/ld+json">
      <?php echo json_encode([
          '@context' => 'https://schema.org',
          '@type' => 'ImageObject',
          'name' => $title,
          'description' => $description,
          'contentUrl' => $image,
          'author' => ['@type' => 'Person', 'name' => $author],
          'url' => $memeUrl,
      ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>
    </script>
  </head>
  <body>
    <noscript>
      <p>
        Open meme:
        <a href="<?php echo html_escape($memeUrl); ?>"><?php echo html_escape($memeUrl); ?></a>
      </p>
    </noscript>
    <script>
      window.location.replace(<?php echo json_encode($memeUrl, JSON_UNESCAPED_SLASHES); ?>);
    </script>
  </body>
</html>
