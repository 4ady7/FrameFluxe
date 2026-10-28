<?php

declare(strict_types=1);

function framefluxConfig(): array
{
    $config = [];
    $path = dirname(__DIR__, 2) . '/config.php';
    if (is_file($path)) {
        $loaded = require $path;
        if (is_array($loaded)) {
            $config = $loaded;
        }
    }
    return $config;
}

function framefluxApiKey(array $config): string
{
    $fromFile = trim((string) ($config['openai_api_key'] ?? ''));
    if ($fromFile !== '') {
        return $fromFile;
    }
    $fromEnv = getenv('OPENAI_API_KEY');
    return is_string($fromEnv) ? trim($fromEnv) : '';
}

function framefluxChatModel(array $config): string
{
    $model = trim((string) ($config['openai_model'] ?? ''));
    return $model !== '' ? $model : 'gpt-4o-mini';
}

function framefluxImageModel(array $config): string
{
    $model = trim((string) ($config['openai_image_model'] ?? 'gpt-image-2'));
    return $model !== '' ? $model : 'gpt-image-2';
}