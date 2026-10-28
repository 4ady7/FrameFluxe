<?php

declare(strict_types=1);

require_once __DIR__ . '/grammar.php';

const FRAMEFLUX_PATTERNS = [
    'flow',
    'grid',
    'particles',
    'rings',
    'mesh',
    'halftone',
    'hatching',
    'creases',
    'marbling',
    'sunburst',
];
const FRAMEFLUX_LAYOUTS = [
    'centered',
    'off-center-top',
    'off-center-bottom',
    'split-editorial',
    'frame-inset',
];
const FRAMEFLUX_STYLES = ['bold', 'elegant', 'condensed', 'geometric', 'editorial'];
const FRAMEFLUX_LIGHTING = [
    'chiaroscuro',
    'neon',
    'overcast',
    'golden-hour',
    'moonlit',
    'practical',
    'harsh',
    'rim',
    'backlit',
    'high-key',
    'theatrical',
    'coastal-haze',
    'bloom',
    'hard-sun',
    'shaft',
    'domestic-warm',
    'window-light',
];
const FRAMEFLUX_CAMERA = ['wide', 'close', 'aerial', 'dutch', 'tracking', 'static'];

const FRAMEFLUX_METAPHORS = [
    'fractured-glass',
    'eclipse',
    'locked-mechanism',
    'decaying-photograph',
    'tangled-roots',
    'maze',
    'burning-document',
    'distorted-reflection',
    'clock-mechanism',
    'biological-cell',
    'architectural-ruin',
    'orbital-system',
    'keyhole',
    'map-fold',
    'signal',
    'silhouette-threshold',
    'chaotic-key',
    'chandelier-cluster',
    'tangled-cords',
    'coastal-compass',
    'handwritten-letter',
    'weathered-door',
    'correspondence-clock',
    'railway-route',
    'paired-objects',
    'postcard',
    'compass-rose',
    'canine-silhouette',
    'animal-tracks',
    'mountain-ridge',
    'alpine-peak',
    'wild-canopy',
    'botanical-press',
    'forest-fringe',
];

const FRAMEFLUX_MATERIALS = [
    'glass',
    'metal',
    'paper',
    'concrete',
    'fabric',
    'film-stock',
    'smoke',
    'water',
    'dust',
    'wood',
    'rust',
    'ink',
    'stone',
    'plastic',
    'foil',
    'cardstock',
    'linen',
    'leather',
    'brass',
    'fur',
    'bone',
    'bark',
    'pressed-leaves',
    'granite',
    'slate',
];

const FRAMEFLUX_TEXTURES = [
    'distressed',
    'smooth',
    'grainy',
    'scratched',
    'weathered',
    'glossy',
    'dusty',
    'corroded',
    'fibrous',
    'translucent',
    'photographic',
];

const FRAMEFLUX_SPATIAL = [
    'compressed',
    'fragmented',
    'expanding',
    'collapsing',
    'spiralling',
    'rising',
    'drifting',
    'converging',
    'isolated',
    'claustrophobic',
    'expansive',
];

const FRAMEFLUX_PARTICLE_SEMANTICS = [
    'dust',
    'ash',
    'stars',
    'rain',
    'sparks',
    'pollen',
    'debris',
    'grain',
    'confetti',
    'salt',
    'sand',
    'ember',
];

const FRAMEFLUX_LINE_SEMANTICS = [
    'cracks',
    'roots',
    'wiring',
    'threads',
    'veins',
    'roads',
    'circuitry',
    'plans',
    'cords',
    'ribbons',
    'waves',
    'coastline',
    'handwriting',
    'horizon',
    'contour',
    'trails',
    'railway',
    'tendrils',
    'fault-lines',
    'paw-prints',
];

const FRAMEFLUX_EMOTIONS = [
    'paranoia',
    'wonder',
    'grief',
    'isolation',
    'urgency',
    'nostalgia',
    'dread',
    'intimacy',
    'triumph',
    'unease',
    'longing',
    'playfulness',
    'hope',
];

const FRAMEFLUX_NARRATIVES = [
    'escape',
    'investigation',
    'forbidden-love',
    'survival',
    'identity',
    'betrayal',
    'discovery',
    'control',
    'family',
    'transformation',
    'obsession',
    'memory',
];

const FRAMEFLUX_TITLE_WEIGHTS = ['hairline', 'light', 'regular', 'bold', 'black'];
const FRAMEFLUX_TITLE_CASES = ['uppercase', 'title', 'lowercase', 'mixed'];
const FRAMEFLUX_LETTERFORMS = [
    'classical-serif',
    'slab-serif',
    'geometric-sans',
    'grotesque',
    'condensed',
    'extended',
    'hand-lettered',
    'distressed',
    'technical-stencil',
];
const FRAMEFLUX_TRACKING = ['tight', 'normal', 'wide'];
const FRAMEFLUX_TITLE_STRUCTURES = ['solid', 'outline', 'fragmented', 'layered', 'textured', 'gradient'];
const FRAMEFLUX_TITLE_PLACEMENTS = ['upper-third', 'lower-third', 'centered', 'split'];

const FRAMEFLUX_QUOTE_STYLES = [
    'editorial-italic',
    'caption',
    'cinematic-subtitle',
    'typewriter',
    'handwritten',
];
const FRAMEFLUX_QUOTE_LEGIBILITY = ['scrim', 'shadow', 'plate', 'none'];
const FRAMEFLUX_QUOTE_PLACEMENTS = ['below-title', 'bottom-anchored', 'focal-adjacent'];

/**
 * Letterform families grouped by typographic category. Used to force the quote
 * face to contrast with the title face instead of repeating it smaller.
 */
const FRAMEFLUX_LETTERFORM_CATEGORY = [
    'classical-serif' => 'serif',
    'slab-serif' => 'serif',
    'distressed' => 'serif',
    'geometric-sans' => 'sans',
    'grotesque' => 'sans',
    'condensed' => 'sans',
    'extended' => 'sans',
    'technical-stencil' => 'sans',
    'hand-lettered' => 'script',
];

const FRAMEFLUX_QUOTE_STYLE_CATEGORY = [
    'editorial-italic' => 'serif',
    'caption' => 'sans',
    'cinematic-subtitle' => 'sans',
    'typewriter' => 'mono',
    'handwritten' => 'script',
];

const FRAMEFLUX_LIGHTING_ALIASES = [
    'noir' => 'chiaroscuro',
    'hard' => 'harsh',
    'dramatic' => 'chiaroscuro',
    'neon-wash' => 'neon',
];

const FRAMEFLUX_METAPHOR_ALIASES = [
    'lock' => 'locked-mechanism',
    'clock-face' => 'clock-mechanism',
    'clock' => 'clock-mechanism',
    'signal-burst' => 'signal',
    'silhouette' => 'silhouette-threshold',
    'roots' => 'tangled-roots',
    'dog' => 'canine-silhouette',
    'canine' => 'canine-silhouette',
    'tracks' => 'animal-tracks',
    'mountain' => 'mountain-ridge',
    'peak' => 'alpine-peak',
    'summit' => 'alpine-peak',
    'canopy' => 'wild-canopy',
    'garden' => 'botanical-press',
    'forest' => 'wild-canopy',
];

const FRAMEFLUX_LINE_ALIASES = [
    'thread' => 'threads',
    'wave' => 'waves',
    'trail' => 'trails',
    'crack' => 'cracks',
    'tendril' => 'tendrils',
    'fault' => 'fault-lines',
    'paw' => 'paw-prints',
    'paws' => 'paw-prints',
];

const FRAMEFLUX_PARTICLE_ALIASES = [
    'spark' => 'sparks',
    'starfield' => 'stars',
    'crystal-shard' => 'debris',
];

const FRAMEFLUX_HUMAN_ELEMENTS = [
    'none',
    'silhouette',
    'hands',
    'letter',
    'tickets',
    'cups',
    'paired-objects',
    'signage',
    'map',
    'animal-silhouette',
    'flora',
];

const FRAMEFLUX_LAYOUT_ALIASES = [
    'hero' => 'centered',
    'centered' => 'centered',
    'editorial' => 'off-center-top',
    'top-heavy' => 'off-center-top',
    'off-center-top' => 'off-center-top',
    'billing' => 'off-center-bottom',
    'bottom-heavy' => 'off-center-bottom',
    'off-center-bottom' => 'off-center-bottom',
    'split-editorial' => 'split-editorial',
    'diagonal' => 'split-editorial',
    'frame-inset' => 'frame-inset',
];

const FRAMEFLUX_PATTERN_ALIASES = [
    'flow' => 'flow',
    'grid' => 'grid',
    'particles' => 'particles',
    'rings' => 'rings',
    'mesh' => 'mesh',
    'concentric' => 'rings',
    'angular' => 'mesh',
    'organic' => 'flow',
    'topo' => 'flow',
    'fiber' => 'flow',
    'halftone' => 'halftone',
    'hatching' => 'hatching',
    'creases' => 'creases',
    'marbling' => 'marbling',
    'sunburst' => 'sunburst',
    'hatch' => 'hatching',
    'crease' => 'creases',
    'marble' => 'marbling',
    'dots' => 'halftone',
    'screenprint' => 'halftone',
    'noise' => 'particles',
    'none' => 'flow',
];

function sanitizeHex(string $value, string $fallback): string
{
    return preg_match('/^#([0-9a-fA-F]{6})$/', $value) ? strtolower($value) : $fallback;
}

function clamp(float $value, float $min, float $max): float
{
    return max($min, min($max, $value));
}

function enumValue(string $value, array $allowed, string $fallback): string
{
    $key = strtolower(trim($value));
    return in_array($key, $allowed, true) ? $key : $fallback;
}

function aliasedEnum(string $value, array $aliases, array $allowed, string $fallback): string
{
    $key = strtolower(trim($value));
    $key = $aliases[$key] ?? $key;
    return enumValue($key, $allowed, $fallback);
}

function coerceToList(string $value, array $allowed, string $fallback): string
{
    if ($allowed === []) {
        return $fallback;
    }
    return in_array($value, $allowed, true) ? $value : $fallback;
}

function storySupportsAtmosphericLight(string $title, string $genre, string $pitch): bool
{
    $blob = strtolower($title . ' ' . $genre . ' ' . $pitch);
    return (bool) preg_match(
        '/\b(dusk|dawn|twilight|night|midnight|storm|tempest|overcast|moonlit?|nocturnal|after dark|sundown|sunrise|gloaming|eclipse|rain-dark|sodium|daylight|candlelit|low-light|fog)\b/',
        $blob
    );
}

function hexLuminance(string $hex): float
{
    $hex = ltrim($hex, '#');
    if (strlen($hex) !== 6) {
        return 0.15;
    }
    $r = hexdec(substr($hex, 0, 2));
    $g = hexdec(substr($hex, 2, 2));
    $b = hexdec(substr($hex, 4, 2));
    return (0.299 * $r + 0.587 * $g + 0.114 * $b) / 255.0;
}

function familyEmotionDefault(string $family): string
{
    return match ($family) {
        'comedy', 'animation', 'musical' => 'playfulness',
        'romance' => 'longing',
        'contemporary', 'coming-of-age', 'family' => 'nostalgia',
        'adventure', 'fantasy' => 'wonder',
        'thriller' => 'urgency',
        'horror' => 'dread',
        'scifi' => 'unease',
        'mystery' => 'unease',
        'historical', 'documentary' => 'nostalgia',
        default => 'intimacy',
    };
}

function clipText(string $value, int $max, string $fallback = ''): string
{
    $trimmed = trim($value);
    if ($trimmed === '') {
        return $fallback;
    }
    return mb_substr($trimmed, 0, $max);
}

function clipConversationNotes(string $value): string
{
    $trimmed = trim(preg_replace("/[ \t]+/u", ' ', str_replace(["\r\n", "\r"], "\n", $value)) ?? '');
    $trimmed = trim(preg_replace("/\n{3,}/", "\n\n", $trimmed) ?? '');
    if ($trimmed === '') {
        return '';
    }
    return mb_substr($trimmed, 0, 1200);
}

function conversationDirectionBlock(string $notes): string
{
    if ($notes === '') {
        return '';
    }
    return <<<TEXT

Optional direction the audience told Pulp. Treat it as story input alongside the pitch. Let it shape emotionalCore, visualMetaphor, cinematic.subject, cinematic.environment, mood, and materials. Do not copy it into concept.pitch. Do not render it as typography or as words in the image.
Darkroom notes:
{$notes}
TEXT;
}

function quoteWordCount(string $value): int
{
    $words = preg_split('/\s+/', trim($value), -1, PREG_SPLIT_NO_EMPTY);
    return is_array($words) ? count($words) : 0;
}

/**
 * Drop sentences that ask the image model to render poster copy.
 * The cinematic plate must stay a textless still.
 */
function plateLooksLikePosterCopy(string $text): bool
{
    if (str_contains($text, 'REF://')) {
        return true;
    }
    return (bool) preg_match(
        '/\b(movie poster|title card|tagline|credits?\b|logo|typography|lettering|typeface|caption|HUD|on[- ]screen text|readable (letters?|text|type)|poster typography|reserve(?:d)? (?:space )?for (?:the )?title|reference (code|label|identifier))\b/i',
        $text
    );
}

function ensureTextlessPlate(string $text, string $fallback): string
{
    $trimmed = trim($text);
    if ($trimmed === '') {
        return $fallback;
    }
    $parts = preg_split('/(?<=[.!?])\s+/', $trimmed) ?: [$trimmed];
    $kept = [];
    foreach ($parts as $part) {
        if (plateLooksLikePosterCopy($part)) {
            continue;
        }
        $kept[] = $part;
    }
    $out = trim(implode(' ', $kept));
    return $out !== '' ? $out : $fallback;
}

function resolveLayout(string $raw): string
{
    $key = strtolower(trim($raw));
    return FRAMEFLUX_LAYOUT_ALIASES[$key] ?? 'centered';
}

function resolvePattern(string $raw, string $fallback = 'flow'): string
{
    $key = strtolower(trim($raw));
    return FRAMEFLUX_PATTERN_ALIASES[$key] ?? $fallback;
}

function nextPattern(string $pattern): string
{
    $i = array_search($pattern, FRAMEFLUX_PATTERNS, true);
    $i = $i === false ? 0 : $i;
    return FRAMEFLUX_PATTERNS[($i + 1) % count(FRAMEFLUX_PATTERNS)];
}

/**
 * Keep only the fields the model is allowed to see on Improve / Reimagine.
 */
function whitelistPrevious(?array $previous): ?array
{
    if ($previous === null) {
        return null;
    }

    $normalized = normalizeParams($previous, (string) ($previous['title'] ?? $previous['concept']['title'] ?? 'Film'), (string) ($previous['genre'] ?? $previous['concept']['genre'] ?? 'Drama'), (string) ($previous['pitch'] ?? $previous['concept']['pitch'] ?? ''));

    return [
        'schemaVersion' => '1.3',
        'concept' => [
            'title' => $normalized['concept']['title'],
            'genre' => $normalized['concept']['genre'],
            'pitch' => $normalized['concept']['pitch'],
            'mood' => $normalized['concept']['mood'],
            'quote' => $normalized['concept']['quote'],
        ],
        'semantic' => $normalized['semantic'],
        'cinematic' => [
            'subject' => $normalized['cinematic']['subject'],
            'environment' => $normalized['cinematic']['environment'],
            'lighting' => $normalized['cinematic']['lighting'],
            'atmosphere' => $normalized['cinematic']['atmosphere'],
            'camera' => $normalized['cinematic']['camera'],
        ],
        'palette' => [
            'background' => $normalized['palette']['background'],
            'primary' => $normalized['palette']['primary'],
            'secondary' => $normalized['palette']['secondary'],
            'accent' => $normalized['palette']['accent'],
            'text' => $normalized['palette']['text'],
            'highlight' => $normalized['palette']['highlight'],
        ],
        'composition' => [
            'mode' => $normalized['composition']['mode'],
            'negativeSpace' => $normalized['composition']['negativeSpace'],
        ],
        'procedural' => [
            'primaryPattern' => $normalized['procedural']['primaryPattern'],
            'secondaryPattern' => $normalized['procedural']['secondaryPattern'],
            'density' => $normalized['procedural']['density'],
        ],
        'typography' => [
            'genreVisibility' => 'hidden',
            'title' => $normalized['typography']['title'],
            'quote' => $normalized['typography']['quote'],
        ],
        // Flat aliases consumed by the local improve/reimagine heuristic.
        'emotionalCore' => $normalized['semantic']['emotionalCore'],
        'narrativeCore' => $normalized['semantic']['narrativeCore'],
        'visualMetaphor' => $normalized['semantic']['visualMetaphor'],
        'narrativeAnchor' => $normalized['semantic']['narrativeAnchor'],
        'material' => $normalized['semantic']['material'],
        'texture' => $normalized['semantic']['texture'],
        'spatial' => $normalized['semantic']['spatial'],
        'particleSemantics' => $normalized['semantic']['particleSemantics'],
        'lineSemantics' => $normalized['semantic']['lineSemantics'],
        'mood' => $normalized['mood'],
        'quote' => $normalized['quote'],
        'layout' => $normalized['layout'],
        'primaryPattern' => $normalized['pattern'],
        'secondaryPattern' => $normalized['procedural']['secondaryPattern'],
        'titleStyle' => $normalized['titleStyle'],
        'titleTypographyDirection' => $normalized['typography']['title'],
        'quoteTypographyDirection' => $normalized['typography']['quote'],
        'lighting' => $normalized['cinematic']['lighting'],
        'atmosphere' => $normalized['cinematic']['atmosphere'],
        'camera' => $normalized['cinematic']['camera'],
        'lightDirection' => $normalized['lighting']['direction'],
        'grammarFamily' => $normalized['semantic']['grammarFamily'],
        'narrativeEnergy' => $normalized['semantic']['narrativeEnergy'],
        'compositionGrammar' => $normalized['composition']['grammar'],
        'compositionMode' => $normalized['composition']['mode'] ?? null,
        'artFamily' => $normalized['semantic']['artFamily'] ?? null,
        'proceduralFamily' => $normalized['procedural']['family'],
        'humanElements' => $normalized['semantic']['humanElements'],
        'groundTone' => $normalized['semantic']['groundTone'],
        'print' => $normalized['print'] ?? null,
    ];
}

/**
 * Words a tagline must never end on, so a trimmed pitch cannot read "under an."
 */
const FRAMEFLUX_DANGLING_WORDS = [
    'a', 'an', 'the', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for',
    'from', 'with', 'by', 'as', 'into', 'onto', 'over', 'under', 'that', 'which',
    'who', 'whose', 'is', 'are', 'was', 'were', 'be', 'been', 'his', 'her',
    'their', 'its', 'this', 'these', 'those', 'when', 'while', 'after', 'before',
];

function clipQuote(string $value, string $fallback = 'A story waiting for its first frame.'): string
{
    $trimmed = trim($value);
    if ($trimmed === '') {
        return $fallback;
    }
    $words = preg_split('/\s+/', $trimmed, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    if (count($words) > 12) {
        $words = array_slice($words, 0, 12);
        while ($words !== []) {
            $last = strtolower(rtrim((string) end($words), '.,;:!?'));
            if (!in_array($last, FRAMEFLUX_DANGLING_WORDS, true)) {
                break;
            }
            array_pop($words);
        }
        $trimmed = implode(' ', $words);
    }
    $trimmed = rtrim($trimmed, ' ,;:');
    if ($trimmed !== '' && !preg_match('/[.!?…]$/u', $trimmed)) {
        $trimmed .= '.';
    }
    return clipText($trimmed, 120, $fallback);
}

/**
 * Local cinematic plate when the model omits subject/environment.
 * Describes a still photograph, never a poster.
 *
 * @return array{subject: string, environment: string, atmosphere: string}
 */
function fallbackCinematicPlate(array $semantic, string $lighting): array
{
    $anchor = str_replace('-', ' ', (string) ($semantic['narrativeAnchor'] ?? $semantic['visualMetaphor'] ?? 'threshold'));
    $material = (string) ($semantic['material'] ?? 'paper');
    $texture = (string) ($semantic['texture'] ?? 'grainy');
    $spatial = (string) ($semantic['spatial'] ?? 'isolated');
    $human = (string) ($semantic['humanElements'] ?? 'none');
    $family = (string) ($semantic['grammarFamily'] ?? 'drama');
    $ground = (string) ($semantic['groundTone'] ?? 'mid');

    $humanClause = match ($human) {
        'hands' => 'a pair of hands at the edge of frame, faces unseen',
        'letter' => 'an opened letter in the foreground whose marks stay illegible as paper texture',
        'tickets' => 'worn paper tickets on a surface, printing reduced to texture',
        'cups' => 'two cups left on a table, still catching the light',
        'paired-objects' => 'two matching objects set slightly apart',
        'signage' => 'blank weathered signage with unmarked faces',
        'map' => 'a folded map whose routes remain illegible texture',
        'silhouette' => 'a distant human silhouette, face unseen',
        'animal-silhouette' => 'a watchful animal silhouette at the edge of the frame, no posed human portrait',
        'flora' => 'living or pressed botanical forms, no posed human portrait',
        default => 'no posed portrait, unmarked surfaces',
    };

    $metaphor = (string) ($semantic['visualMetaphor'] ?? $semantic['narrativeAnchor'] ?? '');
    $natureSubject = match ($metaphor) {
        'canine-silhouette' => "A cinematic still of a watchful dog in profile against open country, {$texture} {$material} catching {$lighting} light, {$spatial} staging, no studio fashion portrait",
        'animal-tracks' => "A cinematic still of animal tracks crossing weathered ground, {$texture} {$material} catching {$lighting} light, {$spatial} staging, wildlife present as environmental fact, no posed human portrait",
        'mountain-ridge', 'alpine-peak' => "A cinematic still of a faceted mountain mass and ridgeline, {$texture} {$material} catching {$lighting} light, {$spatial} staging, alpine weather in the air, no posed human portrait",
        'wild-canopy', 'forest-fringe' => "A cinematic still of a living canopy and forest fringe, {$texture} {$material} catching {$lighting} light, {$spatial} staging, botanical mass as the subject, no posed human portrait",
        'botanical-press' => "A cinematic still of pressed plants and archival botanical sheets, {$texture} {$material} catching {$lighting} light, {$spatial} staging, no posed human portrait",
        default => null,
    };
    $subject = $natureSubject ?? "A cinematic still photograph of {$anchor} as a physical presence in the frame, {$texture} {$material} catching {$lighting} light, {$spatial} staging, {$humanClause}";

    $environment = match ($metaphor) {
        'canine-silhouette', 'animal-tracks' => 'open countryside with a distant ridge, packed earth and wind in the grass, unused space at the edges',
        'mountain-ridge', 'alpine-peak' => 'high alpine terrain under a wide sky, granite faces and weather moving across the slopes',
        'wild-canopy', 'forest-fringe' => 'a forest edge where canopy light breaks into the understorey, bark and leaf-litter underfoot',
        'botanical-press' => 'a neglected greenhouse or herbarium table, pressed sheets and living stems sharing the same light',
        default => match ($family) {
            'comedy' => 'a sunlit, slightly chaotic interior with paper clutter and generous empty floor around the object',
            'romance' => 'a weathered coastal interior opening toward hazy shoreline air, linen and salt on every surface',
            'contemporary' => 'a quiet domestic threshold beside a commuter window, warm indoor light against cooler glass',
            'adventure' => 'open terrain under a wide sky, packed earth and distant ridgelines, room to travel',
            'thriller' => 'a compressed interior of glass and shadow, sightlines interrupted',
            'scifi' => 'an unfamiliar architectural volume, physically built rather than holographic',
            'horror' => 'a dim threshold where the far room falls out of sight',
            'mystery' => 'a study of paper, wood, and withheld light',
            'fantasy' => 'a mythic landscape of weathered stone and open sky, physically grounded',
            default => $ground === 'light'
                ? 'a physically believable interior with paper-warm walls and unused space at the edges'
                : 'a physically believable interior with unused space at the edges of the frame',
        },
    };

    return [
        'subject' => $subject,
        'environment' => $environment,
        'atmosphere' => $texture . ' air, physically believable haze',
    ];
}

/**
 * The genre never reaches the poster, so it is deliberately not a quote source.
 */
function fallbackQuote(string $title, string $genre, string $pitch, int $seed): string
{
    $shortTitle = mb_strlen($title) > 28 ? mb_substr($title, 0, 25) . '…' : $title;
    $options = [
        'Where the story refuses to stay still.',
        'A quiet truth, lit by danger.',
        'Every map hides another city.',
        'Love, dread, and unfinished business.',
        'The night keeps better secrets.',
        'Nothing stays buried for long.',
        'Some doors only open once.',
        'What is kept is never safe.',
    ];

    if ($pitch !== '') {
        $words = preg_split('/\s+/', trim($pitch)) ?: [];
        $snippet = array_slice($words, 0, 9);
        // Never end a tagline on a dangling article or preposition.
        while ($snippet !== []) {
            $last = strtolower(rtrim((string) end($snippet), '.,;:!?'));
            if (!in_array($last, FRAMEFLUX_DANGLING_WORDS, true)) {
                break;
            }
            array_pop($snippet);
        }
        if (count($snippet) >= 4) {
            $options[] = rtrim(implode(' ', $snippet), '.,;:') . '.';
        }
    }

    $options[] = $shortTitle . ' begins after dark.';

    return $options[$seed % count($options)];
}

/**
 * Extract a film-specific semantic profile from title, genre, and pitch.
 * Genre family is a visual grammar: metaphor, material, and line language are
 * chosen from that family's allow-list. Keyword hits still win when they fit.
 */
function inferSemanticProfile(string $title, string $genre, string $pitch, int $seed): array
{
    $text = strtolower($title . ' ' . $genre . ' ' . $pitch);
    $family = inferGenreFamily($genre, $title . ' ' . $pitch);
    $grammar = genreGrammar($family);

    $emotionRules = [
        'playfulness' => ['comedy', 'funny', 'joke', 'absurd', 'sitcom', 'hilarious', 'farce', 'screwball', 'punchline'],
        'paranoia' => ['paranoid', 'watch', 'surveil', 'followed', 'suspect', 'trust'],
        'dread' => ['horror', 'haunt', 'curse', 'nightmare', 'terror', 'dread'],
        'isolation' => ['alone', 'isolat', 'desert', 'empty', 'abandoned', 'lone', 'solitude'],
        'wonder' => ['wonder', 'magic', 'dream', 'discover', 'star', 'cosmos', 'fantasy'],
        'grief' => ['grief', 'loss', 'mourn', 'funeral', 'widow', 'death', 'goodbye'],
        'urgency' => ['race', 'escape', 'deadline', 'chase', 'countdown', 'heist', 'bomb'],
        'nostalgia' => ['memory', 'childhood', 'past', 'remember', 'archive', 'letter', 'summer'],
        'intimacy' => ['love', 'romance', 'kiss', 'affair', 'heart', 'desire', 'letters'],
        'triumph' => ['victory', 'win', 'rise', 'champion', 'freedom'],
        'unease' => ['mystery', 'strange', 'uncanny', 'wrong', 'secret'],
        'longing' => ['miss', 'distant', 'wait', 'yearn', 'away', 'solitude', 'between'],
        'hope' => ['hope', 'dawn', 'begin', 'promise'],
    ];

    $narrativeRules = [
        'investigation' => ['detect', 'clue', 'investig', 'case', 'evidence', 'mystery'],
        'escape' => ['escape', 'flee', 'prison', 'run', 'break'],
        'obsession' => ['obsess', 'fixat', 'compuls', 'cannot stop'],
        'forbidden-love' => ['affair', 'forbidden', 'secret love', 'romance'],
        'survival' => ['survive', 'apocalypse', 'stranded', 'war', 'disaster'],
        'identity' => ['identity', 'who am i', 'impostor', 'double', 'mask'],
        'betrayal' => ['betray', 'double-cross', 'traitor', 'lie'],
        'discovery' => ['discover', 'found', 'map', 'secret city', 'uncover'],
        'control' => ['control', 'system', 'surveil', 'regime', 'algorithm'],
        'memory' => ['memory', 'remember', 'forget', 'archive', 'photograph', 'letter'],
        'transformation' => ['become', 'transform', 'mutation', 'change'],
        'family' => ['family', 'mother', 'father', 'daughter', 'son', 'home'],
    ];

    $metaphorRules = [
        'chaotic-key' => ['mansion', 'rent', 'landlord', 'keyhole', 'key ring'],
        'chandelier-cluster' => ['chandelier', 'ballroom', 'gala', 'luxury'],
        'tangled-cords' => ['tangled', 'cords', 'wires', 'mess'],
        'coastal-compass' => ['cape', 'coast', 'solitude', 'lighthouse', 'sea glass', 'harbour', 'harbor'],
        'handwritten-letter' => ['letter', 'correspondence', 'handwrit', 'stationery'],
        'correspondence-clock' => ['station', 'timetable', 'commute', 'between stations'],
        'railway-route' => ['train', 'railway', 'platform', 'tracks'],
        'postcard' => ['postcard', 'summer', 'holiday', 'vacation'],
        'weathered-door' => ['doorway', 'threshold', 'old house', 'porch'],
        'paired-objects' => ['two', 'pair', 'together', 'between'],
        'compass-rose' => ['compass', 'expedition', 'voyage', 'navigate'],
        'map-fold' => ['map', 'cartograph', 'city', 'street', 'atlas', 'border'],
        'fractured-glass' => ['glass', 'mirror', 'shatter', 'crack', 'window', 'reflection'],
        'keyhole' => ['key', 'lock', 'vault', 'door', 'secret', 'heist'],
        'locked-mechanism' => ['machine', 'mechanism', 'gear', 'clockwork', 'device'],
        'clock-mechanism' => ['time', 'clock', 'deadline', 'hour', 'countdown'],
        'decaying-photograph' => ['memory', 'photograph', 'archive', 'past'],
        'tangled-roots' => ['root', 'family', 'forest', 'organic', 'bloodline'],
        'maze' => ['maze', 'labyrinth', 'corridor', 'lost', 'confus'],
        'eclipse' => ['eclipse', 'moon', 'sun', 'shadow', 'orbit'],
        'orbital-system' => ['space', 'planet', 'orbit', 'satellite', 'cosmos', 'sci'],
        'burning-document' => ['burn', 'fire', 'ash', 'document', 'evidence destroyed'],
        'distorted-reflection' => ['double', 'reflection', 'identity', 'impostor', 'twin'],
        'biological-cell' => ['body', 'virus', 'blood', 'organic', 'mutation'],
        'architectural-ruin' => ['ruin', 'building', 'concrete', 'collapse', 'cityscape'],
        'signal' => ['signal', 'radio', 'broadcast', 'frequency', 'message'],
        'silhouette-threshold' => ['figure', 'arrival', 'departure', 'silhouette'],
        'canine-silhouette' => ['dog', 'dogs', 'canine', 'puppy', 'hound', 'shepherd', 'retriever', 'wolfdog', 'kennel', 'leash'],
        'animal-tracks' => ['paw', 'paws', 'animal track'],
        'mountain-ridge' => ['mountain', 'mountains', 'ridge', 'range', 'highland', 'slope'],
        'alpine-peak' => ['peak', 'summit', 'alpine', 'ascent', 'glacier', 'cliff'],
        'wild-canopy' => ['canopy', 'forest', 'woods', 'woodland'],
        'botanical-press' => ['botanical', 'botany', 'garden', 'gardens', 'herbarium', 'pressed', 'greenhouse'],
        'forest-fringe' => ['orchard', 'vine', 'fern', 'understorey'],
    ];

    $materialRules = [
        'glass' => ['glass', 'mirror', 'window', 'crystal', 'chandelier'],
        'foil' => ['foil', 'luxury', 'glitz', 'mansion'],
        'cardstock' => ['cardstock', 'ticket', 'stationery', 'brochure'],
        'linen' => ['linen', 'cloth', 'coast', 'summer'],
        'leather' => ['leather', 'expedition', 'journal', 'saddle'],
        'brass' => ['brass', 'compass', 'instrument', 'spyglass'],
        'metal' => ['metal', 'steel', 'copper', 'iron', 'vault', 'machine'],
        'paper' => ['paper', 'letter', 'document', 'map', 'photograph', 'archive'],
        'concrete' => ['concrete', 'bunker', 'brutal', 'parking', 'overpass'],
        'fabric' => ['fabric', 'cloth', 'curtain', 'dress', 'veil'],
        'film-stock' => ['film', 'cinema', 'photograph', 'memory'],
        'smoke' => ['smoke', 'fog', 'haze', 'ash', 'burn'],
        'water' => ['water', 'river', 'rain', 'ocean', 'flood', 'sea', 'coast'],
        'dust' => ['dust', 'desert', 'abandoned', 'attic'],
        'wood' => ['wood', 'cabin', 'forest', 'western'],
        'rust' => ['rust', 'corrosion', 'decay', 'industrial'],
        'ink' => ['ink', 'print', 'newspaper', 'blueprint'],
        'stone' => ['stone', 'ruin', 'temple', 'grave'],
        'plastic' => ['plastic', 'neon', 'synthetic', 'chrome'],
        'fur' => ['fur', 'canine', 'puppy', 'hound', 'retriever', 'wolfdog', 'pelt'],
        'bone' => ['bone', 'skeleton', 'ivory'],
        'bark' => ['tree bark', 'woodland', 'canopy', 'trunk'],
        'pressed-leaves' => ['pressed', 'herbarium', 'botanical', 'leaves', 'leaf'],
        'granite' => ['granite', 'mountain', 'peak', 'summit'],
        'slate' => ['slate', 'alpine', 'ridge', 'cliff'],
    ];

    $pickHits = static function (array $rules, string $text, array $allow = []) {
        $hits = [];
        foreach ($rules as $label => $needles) {
            if ($allow !== [] && !in_array($label, $allow, true)) {
                continue;
            }
            foreach ($needles as $needle) {
                if (str_contains($text, $needle)) {
                    $hits[$label] = ($hits[$label] ?? 0) + 1;
                }
            }
        }
        if ($hits === []) {
            return null;
        }
        arsort($hits);
        return array_key_first($hits);
    };

    $allowedMetaphors = $grammar['metaphors'] ?? FRAMEFLUX_METAPHORS;
    $allowedMaterials = $grammar['materials'] ?? FRAMEFLUX_MATERIALS;

    $emotion = $pickHits($emotionRules, $text) ?? familyEmotionDefault($family);
    $narrative = $pickHits($narrativeRules, $text) ?? FRAMEFLUX_NARRATIVES[($seed + 3) % count(FRAMEFLUX_NARRATIVES)];

    $hint = storyMetaphorHint($title . ' ' . $pitch, $allowedMetaphors);
    $metaphor = $hint ?? $pickHits($metaphorRules, $text) ?? pickFromGrammar($allowedMetaphors, $seed + 7);
    if (!in_array($metaphor, FRAMEFLUX_METAPHORS, true)) {
        $metaphor = pickFromGrammar($allowedMetaphors, $seed + 7);
    }

    $material = $pickHits($materialRules, $text, $allowedMaterials)
        ?? $pickHits($materialRules, $text)
        ?? pickFromGrammar($allowedMaterials, $seed + 11);
    if (!in_array($material, $allowedMaterials, true) && in_array($material, ['metal', 'plastic', 'concrete'], true) && !isTechFamily($family)) {
        $material = pickFromGrammar($allowedMaterials, $seed + 11);
    }
    $material = in_array($material, FRAMEFLUX_MATERIALS, true) ? $material : pickFromGrammar($allowedMaterials, $seed + 11);

    $particleMap = [
        'burning-document' => 'ash',
        'eclipse' => 'stars',
        'orbital-system' => 'stars',
        'architectural-ruin' => 'dust',
        'tangled-roots' => 'pollen',
        'fractured-glass' => 'debris',
        'map-fold' => 'dust',
        'signal' => 'sparks',
        'biological-cell' => 'pollen',
        'chaotic-key' => 'confetti',
        'chandelier-cluster' => 'confetti',
        'tangled-cords' => 'confetti',
        'coastal-compass' => 'salt',
        'handwritten-letter' => 'dust',
        'correspondence-clock' => 'dust',
        'railway-route' => 'dust',
        'postcard' => 'pollen',
        'compass-rose' => 'sand',
        'weathered-door' => 'dust',
        'paired-objects' => 'dust',
        'canine-silhouette' => 'dust',
        'animal-tracks' => 'dust',
        'mountain-ridge' => 'sand',
        'alpine-peak' => 'dust',
        'wild-canopy' => 'pollen',
        'botanical-press' => 'pollen',
        'forest-fringe' => 'pollen',
    ];
    $lineMap = [
        'fractured-glass' => 'cracks',
        'tangled-roots' => 'roots',
        'maze' => 'plans',
        'map-fold' => 'roads',
        'locked-mechanism' => 'wiring',
        'clock-mechanism' => 'wiring',
        'orbital-system' => 'circuitry',
        'signal' => 'circuitry',
        'biological-cell' => 'veins',
        'decaying-photograph' => 'threads',
        'architectural-ruin' => 'plans',
        'chaotic-key' => 'cords',
        'chandelier-cluster' => 'ribbons',
        'tangled-cords' => 'cords',
        'coastal-compass' => 'waves',
        'handwritten-letter' => 'handwriting',
        'correspondence-clock' => 'railway',
        'railway-route' => 'railway',
        'postcard' => 'horizon',
        'compass-rose' => 'contour',
        'weathered-door' => 'horizon',
        'paired-objects' => 'threads',
        'canine-silhouette' => 'paw-prints',
        'animal-tracks' => 'paw-prints',
        'mountain-ridge' => 'fault-lines',
        'alpine-peak' => 'fault-lines',
        'wild-canopy' => 'tendrils',
        'botanical-press' => 'tendrils',
        'forest-fringe' => 'tendrils',
    ];

    $allowedParticles = $grammar['particleSemantics'] ?? FRAMEFLUX_PARTICLE_SEMANTICS;
    $allowedLines = $grammar['lineSemantics'] ?? FRAMEFLUX_LINE_SEMANTICS;
    $particle = coerceToList(
        $particleMap[$metaphor] ?? pickFromGrammar($allowedParticles, $seed + 5),
        $allowedParticles,
        pickFromGrammar($allowedParticles, $seed + 5)
    );
    $line = coerceToList(
        $lineMap[$metaphor] ?? pickFromGrammar($allowedLines, $seed + 9),
        $allowedLines,
        pickFromGrammar($allowedLines, $seed + 9)
    );

    if (!isTechFamily($family) && in_array($line, FRAMEFLUX_TECH_LINES, true)) {
        $line = pickFromGrammar($allowedLines, $seed + 9);
    }

    $natureBind = match ($metaphor) {
        'canine-silhouette', 'animal-tracks' => ['material' => 'fur', 'line' => 'paw-prints', 'human' => 'animal-silhouette', 'texture' => 'fibrous'],
        'mountain-ridge' => ['material' => 'granite', 'line' => 'fault-lines', 'texture' => 'weathered'],
        'alpine-peak' => ['material' => 'slate', 'line' => 'fault-lines', 'texture' => 'weathered'],
        'wild-canopy', 'forest-fringe' => ['material' => 'bark', 'line' => 'tendrils', 'human' => 'flora', 'texture' => 'weathered'],
        'botanical-press' => ['material' => 'pressed-leaves', 'line' => 'tendrils', 'human' => 'flora', 'texture' => 'fibrous'],
        default => null,
    };
    $natureStory = is_array($natureBind) && match ($metaphor) {
        'canine-silhouette', 'animal-tracks' => (bool) preg_match('/\b(dog|dogs|canine|puppy|hound|shepherd|retriever|wolfdog|kennel|paw|leash)\b/', $text),
        'mountain-ridge', 'alpine-peak' => (bool) preg_match('/\b(mountain|mountains|peak|summit|alpine|ridge|cliff|glacier|highland|ascent)\b/', $text),
        'wild-canopy', 'botanical-press', 'forest-fringe' => (bool) preg_match('/\b(botanical|botany|garden|gardens|forest|woods|woodland|canopy|leaf|leaves|fern|vine|plant|orchard|greenhouse|herbarium|pressed)\b/', $text),
        default => false,
    };
    if (is_array($natureBind) && $natureStory) {
        if (in_array($natureBind['material'], FRAMEFLUX_MATERIALS, true)) {
            $material = $natureBind['material'];
        }
        if (in_array($natureBind['line'], FRAMEFLUX_LINE_SEMANTICS, true)
            && (isTechFamily($family) || !in_array($natureBind['line'], FRAMEFLUX_TECH_LINES, true))) {
            $line = $natureBind['line'];
        }
    }

    $textureMap = [
        'glass' => 'glossy',
        'foil' => 'glossy',
        'metal' => 'scratched',
        'brass' => 'corroded',
        'leather' => 'weathered',
        'paper' => 'fibrous',
        'cardstock' => 'fibrous',
        'linen' => 'fibrous',
        'concrete' => 'weathered',
        'fabric' => 'fibrous',
        'film-stock' => 'photographic',
        'smoke' => 'translucent',
        'water' => 'translucent',
        'dust' => 'dusty',
        'wood' => 'weathered',
        'rust' => 'corroded',
        'ink' => 'grainy',
        'stone' => 'weathered',
        'plastic' => 'smooth',
        'fur' => 'fibrous',
        'bone' => 'weathered',
        'bark' => 'weathered',
        'pressed-leaves' => 'fibrous',
        'granite' => 'weathered',
        'slate' => 'smooth',
    ];
    $allowedTextures = $grammar['textures'] ?? FRAMEFLUX_TEXTURES;
    $texture = coerceToList(
        $textureMap[$material] ?? pickFromGrammar($allowedTextures, $seed + 13),
        $allowedTextures,
        pickFromGrammar($allowedTextures, $seed + 13)
    );

    $spatialMap = [
        'paranoia' => 'claustrophobic',
        'isolation' => 'isolated',
        'urgency' => 'compressed',
        'wonder' => 'expansive',
        'dread' => 'collapsing',
        'grief' => 'drifting',
        'obsession' => 'converging',
        'discovery' => 'expanding',
        'control' => 'compressed',
        'transformation' => 'spiralling',
        'playfulness' => 'fragmented',
        'longing' => 'drifting',
        'nostalgia' => 'isolated',
        'intimacy' => 'isolated',
        'hope' => 'rising',
    ];
    $allowedSpatial = $grammar['spatialFeelings'] ?? FRAMEFLUX_SPATIAL;
    $spatial = coerceToList(
        $spatialMap[$emotion] ?? ($spatialMap[$narrative] ?? pickFromGrammar($allowedSpatial, $seed)),
        $allowedSpatial,
        pickFromGrammar($allowedSpatial, $seed)
    );

    $compositionGrammar = pickFromGrammar($grammar['compositionGrammars'] ?? COMPOSITION_GRAMMARS, $seed + 17);
    $procPrimary = pickFromGrammar($grammar['proceduralPrimary'] ?? PROCEDURAL_FAMILIES, $seed + 19);
    $procSecondary = pickFromGrammar($grammar['proceduralSecondary'] ?? PROCEDURAL_FAMILIES, $seed + 23);
    if ($procSecondary === $procPrimary) {
        $procSecondary = pickFromGrammar($grammar['proceduralSecondary'] ?? PROCEDURAL_FAMILIES, $seed + 29);
    }
    $procAccent = pickFromGrammar($grammar['proceduralAccent'] ?? ['particle'], $seed + 31);
    $human = pickFromGrammar(($grammar['humanElements'] ?? []) !== [] ? $grammar['humanElements'] : ['none'], $seed + 37);
    if ($human === '') {
        $human = 'none';
    }
    if (is_array($natureBind) && $natureStory && isset($natureBind['human'])
        && in_array($natureBind['human'], $grammar['humanElements'] ?? FRAMEFLUX_HUMAN_ELEMENTS, true)) {
        $human = $natureBind['human'];
    }
    $letterBind = [
        'handwritten-letter' => 'letter',
        'correspondence-clock' => 'letter',
    ];
    if (isset($letterBind[$metaphor]) && in_array($letterBind[$metaphor], $grammar['humanElements'] ?? [], true)) {
        $human = $letterBind[$metaphor];
    }

    $energy = (float) ($grammar['narrativeEnergyDefault'] ?? 0.5);
    if ($emotion === 'playfulness' || $emotion === 'urgency' || $emotion === 'triumph') {
        $energy = min(0.95, $energy + 0.08);
    }
    if ($emotion === 'isolation' || $emotion === 'longing' || $emotion === 'grief' || $emotion === 'nostalgia') {
        $energy = max(0.12, $energy - 0.08);
    }

    return [
        'emotionalCore' => $emotion,
        'narrativeCore' => $narrative,
        'visualMetaphor' => $metaphor,
        'narrativeAnchor' => $metaphor,
        'material' => $material,
        'texture' => $texture,
        'spatial' => $spatial,
        'particleSemantics' => $particle,
        'lineSemantics' => $line,
        'grammarFamily' => $family,
        'narrativeEnergy' => round($energy, 2),
        'compositionGrammar' => $compositionGrammar,
        'proceduralFamily' => $procPrimary,
        'proceduralSecondaryFamily' => $procSecondary,
        'proceduralAccent' => $procAccent,
        'humanElements' => $human,
        'groundTone' => $grammar['groundTone'] ?? 'mid',
        'lightingStyle' => pickFromGrammar($grammar['lightingStyles'] ?? FRAMEFLUX_LIGHTING, $seed + 41),
        'compositionMode' => compositionModeFor($family, $compositionGrammar, $seed + 43),
        'artFamily' => artFamilyFor($family, $metaphor, $procPrimary, $seed + 47),
    ];
}

function patternForSemantic(array $semantic, int $seed): array
{
    $family = (string) ($semantic['grammarFamily'] ?? inferGenreFamily('drama'));
    $grammar = genreGrammar($family);
    $allowed = $grammar['patterns'] ?? FRAMEFLUX_PATTERNS;
    $metaphor = $semantic['visualMetaphor'];
    $spatial = $semantic['spatial'];
    $primaryMap = [
        'fractured-glass' => 'mesh',
        'eclipse' => 'rings',
        'locked-mechanism' => 'grid',
        'clock-mechanism' => 'rings',
        'decaying-photograph' => 'particles',
        'tangled-roots' => 'flow',
        'maze' => 'grid',
        'burning-document' => 'particles',
        'distorted-reflection' => 'flow',
        'biological-cell' => 'rings',
        'architectural-ruin' => 'mesh',
        'orbital-system' => 'rings',
        'keyhole' => 'rings',
        'signal' => 'rings',
        'silhouette-threshold' => 'flow',
        'chaotic-key' => 'flow',
        'chandelier-cluster' => 'particles',
        'tangled-cords' => 'flow',
        'coastal-compass' => 'flow',
        'handwritten-letter' => 'flow',
        'weathered-door' => 'flow',
        'correspondence-clock' => 'flow',
        'railway-route' => 'flow',
        'paired-objects' => 'particles',
        'postcard' => 'particles',
        'compass-rose' => 'flow',
        'canine-silhouette' => 'sunburst',
        'animal-tracks' => 'particles',
        'mountain-ridge' => 'hatching',
        'alpine-peak' => 'sunburst',
        'wild-canopy' => 'marbling',
        'botanical-press' => 'creases',
        'forest-fringe' => 'hatching',
        'map-fold' => 'creases',
    ];
    $primary = $primaryMap[$metaphor] ?? pickFromGrammar($allowed, $seed);
    if ($spatial === 'fragmented' || $spatial === 'collapsing') {
        $primary = in_array('flow', $allowed, true) ? 'flow' : $primary;
        if (isTechFamily($family)) {
            $primary = 'mesh';
        }
    } elseif ($spatial === 'spiralling' || $spatial === 'converging') {
        $primary = in_array('rings', $allowed, true) ? 'rings' : $primary;
    } elseif ($spatial === 'drifting' || $spatial === 'expansive') {
        $primary = $primary === 'grid' ? 'flow' : $primary;
    }

    $primary = coerceToList($primary, $allowed, pickFromGrammar($allowed, $seed));
    if (!isTechFamily($family) && in_array($primary, FRAMEFLUX_TECH_PATTERNS, true)) {
        $primary = in_array('flow', $allowed, true) ? 'flow' : pickFromGrammar($allowed, $seed);
    }

    $secondary = count($allowed) > 1
        ? $allowed[(array_search($primary, $allowed, true) + 1) % count($allowed)]
        : nextPattern($primary);
    if (in_array($semantic['particleSemantics'], ['ash', 'dust', 'sparks', 'stars', 'confetti', 'salt', 'sand'], true)
        && in_array('particles', $allowed, true)) {
        $secondary = 'particles';
    }
    if ($secondary === $primary) {
        $secondary = nextPattern($primary);
        $secondary = coerceToList($secondary, $allowed, $secondary);
        if ($secondary === $primary && count($allowed) > 1) {
            $secondary = $allowed[0] === $primary ? $allowed[1] : $allowed[0];
        }
    }
    if (!isTechFamily($family) && in_array($secondary, FRAMEFLUX_TECH_PATTERNS, true)) {
        $secondary = 'particles';
    }
    return [$primary, $secondary];
}

function layoutForSemantic(array $semantic, int $seed): string
{
    $family = (string) ($semantic['grammarFamily'] ?? 'drama');
    $composition = (string) ($semantic['compositionGrammar'] ?? '');
    if ($composition !== '') {
        $layout = layoutForComposition($composition, $seed, $family);
    } else {
        $layout = match ($semantic['spatial'] ?? '') {
            'isolated', 'expansive' => 'centered',
            'rising', 'expanding' => 'off-center-bottom',
            'compressed', 'claustrophobic' => isTechFamily($family) ? 'frame-inset' : ($family === 'comedy' ? 'off-center-bottom' : 'split-editorial'),
            'fragmented' => $family === 'comedy' ? 'off-center-top' : 'split-editorial',
            'drifting' => 'off-center-top',
            default => FRAMEFLUX_LAYOUTS[intdiv($seed, 3) % count(FRAMEFLUX_LAYOUTS)],
        };
    }
    if ($layout === 'frame-inset' && !isTechFamily($family)) {
        $layout = $family === 'comedy' ? 'off-center-bottom' : 'split-editorial';
    }
    if ($family === 'comedy' && $layout === 'split-editorial') {
        $layout = $seed % 2 === 0 ? 'off-center-top' : 'off-center-bottom';
    }
    return $layout;
}

/**
 * Pick the first preferred quote style that does not sit in the same
 * typographic category as the title, so contrast is guaranteed without
 * every clash collapsing onto a single fallback face.
 */
function pickContrastingQuoteStyle(string $titleCategory, array $preferences, int $seed): string
{
    $rotation = FRAMEFLUX_QUOTE_STYLES;
    $offset = $seed % count($rotation);
    $rotated = array_merge(array_slice($rotation, $offset), array_slice($rotation, 0, $offset));

    foreach (array_merge($preferences, $rotated) as $style) {
        if (!in_array($style, FRAMEFLUX_QUOTE_STYLES, true)) {
            continue;
        }
        if ((FRAMEFLUX_QUOTE_STYLE_CATEGORY[$style] ?? 'serif') !== $titleCategory) {
            return $style;
        }
    }

    return 'caption';
}

/**
 * Derive title and quote typography from the story, not from a genre lookup.
 * Genre still nudges the result, but material / emotion / spatial lead.
 */
function inferTypographyDirection(array $semantic, string $genre, int $seed): array
{
    $emotion = $semantic['emotionalCore'];
    $narrative = $semantic['narrativeCore'];
    $material = $semantic['material'];
    $texture = $semantic['texture'];
    $spatial = $semantic['spatial'];
    $g = strtolower($genre);
    $family = (string) ($semantic['grammarFamily'] ?? inferGenreFamily($genre));
    $grammar = genreGrammar($family);

    // Letterforms follow what the poster is made of.
    $letterforms = match ($material) {
        'glass', 'plastic', 'foil' => 'geometric-sans',
        'water' => 'grotesque',
        'metal' => 'technical-stencil',
        'brass' => 'slab-serif',
        'rust' => 'condensed',
        'paper', 'ink', 'cardstock' => 'classical-serif',
        'linen', 'fabric' => 'classical-serif',
        'leather' => 'slab-serif',
        'film-stock' => 'grotesque',
        'concrete' => 'extended',
        'stone' => 'extended',
        'wood' => 'slab-serif',
        'bark' => 'slab-serif',
        'granite', 'slate' => 'extended',
        'fur' => 'grotesque',
        'bone' => 'distressed',
        'pressed-leaves' => 'classical-serif',
        'smoke', 'dust' => 'distressed',
        default => 'grotesque',
    };
    if ($emotion === 'intimacy' && in_array($material, ['fabric', 'paper', 'linen', 'cardstock'], true)) {
        $letterforms = 'hand-lettered';
    }
    if ($narrative === 'control' && $material !== 'paper' && isTechFamily($family)) {
        $letterforms = 'technical-stencil';
    }
    if (in_array($family, ['comedy', 'animation', 'musical'], true)) {
        if (in_array($letterforms, ['technical-stencil', 'distressed', 'classical-serif'], true)) {
            $letterforms = 'extended';
        }
    }
    if (in_array($family, ['romance', 'contemporary', 'coming-of-age'], true) && $letterforms === 'technical-stencil') {
        $letterforms = 'classical-serif';
    }
    if ($family === 'contemporary' && $letterforms === 'hand-lettered') {
        $letterforms = 'classical-serif';
    }
    if (str_contains($g, 'comedy') && $letterforms === 'technical-stencil') {
        $letterforms = 'extended';
    }

    // Case treatment follows emotional register.
    $case = match ($emotion) {
        'intimacy', 'longing', 'grief' => 'lowercase',
        'nostalgia', 'hope' => 'title',
        'playfulness' => 'mixed',
        'urgency', 'paranoia', 'dread', 'triumph' => 'uppercase',
        'wonder' => 'title',
        'isolation' => 'lowercase',
        default => 'uppercase',
    };

    $weight = match ($emotion) {
        'urgency', 'triumph', 'playfulness' => 'black',
        'dread', 'paranoia' => 'bold',
        'intimacy', 'longing' => 'light',
        'isolation' => 'hairline',
        'grief' => 'light',
        default => 'regular',
    };
    if ($letterforms === 'hand-lettered' && in_array($weight, ['hairline', 'black'], true)) {
        $weight = 'regular';
    }

    // Tracking follows how much air the space has.
    $tracking = match ($spatial) {
        'compressed', 'claustrophobic', 'converging' => 'tight',
        'expansive', 'expanding', 'drifting', 'rising' => 'wide',
        default => 'normal',
    };

    // Structure follows material behaviour and spatial break-up.
    $structure = match (true) {
        in_array($spatial, ['fragmented', 'collapsing'], true) => 'fragmented',
        $material === 'glass' || $material === 'foil' => $family === 'comedy' ? 'layered' : 'outline',
        in_array($material, ['metal', 'rust', 'brass'], true) => 'textured',
        in_array($texture, ['corroded', 'scratched', 'weathered'], true) => 'textured',
        in_array($material, ['smoke', 'dust'], true) => 'gradient',
        in_array($material, ['concrete', 'stone'], true) => 'layered',
        default => 'solid',
    };
    $structure = coerceToList($structure, $grammar['titleTreatmentBias'] ?? FRAMEFLUX_TITLE_STRUCTURES, $structure);

    $placement = match ($spatial) {
        'rising', 'expanding' => 'lower-third',
        'drifting' => 'upper-third',
        'isolated' => 'centered',
        'fragmented' => 'split',
        'claustrophobic', 'compressed' => 'lower-third',
        default => FRAMEFLUX_TITLE_PLACEMENTS[$seed % count(FRAMEFLUX_TITLE_PLACEMENTS)],
    };
    $placement = coerceToList($placement, $grammar['titlePlacementBias'] ?? FRAMEFLUX_TITLE_PLACEMENTS, $placement);

    $quotePrefs = $grammar['quoteStyleBias'] ?? [];
    if ($material === 'film-stock' || $texture === 'photographic') {
        $quotePrefs[] = 'cinematic-subtitle';
    }
    if (in_array($narrative, ['investigation', 'control', 'betrayal'], true)) {
        $quotePrefs[] = 'typewriter';
    }
    if ($emotion === 'intimacy' || $letterforms === 'hand-lettered') {
        $quotePrefs[] = 'handwritten';
    }
    if (in_array($emotion, ['nostalgia', 'grief', 'longing'], true)) {
        $quotePrefs[] = 'editorial-italic';
    }
    if (in_array($emotion, ['urgency', 'paranoia', 'dread', 'playfulness'], true)) {
        $quotePrefs[] = 'caption';
    }
    if ($material === 'fabric' || $material === 'linen') {
        $quotePrefs[] = 'handwritten';
    }
    if (in_array($emotion, ['wonder', 'triumph'], true)) {
        $quotePrefs[] = 'cinematic-subtitle';
    }

    $titleCategory = FRAMEFLUX_LETTERFORM_CATEGORY[$letterforms] ?? 'sans';
    $quoteStyle = pickContrastingQuoteStyle($titleCategory, $quotePrefs, $seed);
    $pairing = (FRAMEFLUX_QUOTE_STYLE_CATEGORY[$quoteStyle] ?? 'serif') === $titleCategory
        ? 'complement'
        : 'contrast';

    // Legibility technique belongs to the quote style.
    $quoteLegibility = match ($quoteStyle) {
        'cinematic-subtitle' => 'shadow',
        'typewriter' => 'plate',
        'handwritten' => 'plate',
        'caption' => 'scrim',
        default => 'scrim',
    };

    $quotePlacement = match ($placement) {
        'split' => 'bottom-anchored',
        'centered' => 'below-title',
        'lower-third' => 'below-title',
        'upper-third' => 'bottom-anchored',
        default => 'below-title',
    };
    if ($narrative === 'memory' && $quoteStyle === 'editorial-italic') {
        $quotePlacement = 'bottom-anchored';
    }

    return [
        'title' => [
            'weight' => $weight,
            'case' => $case,
            'letterforms' => $letterforms,
            'tracking' => $tracking,
            'structure' => $structure,
            'placement' => $placement,
        ],
        'quote' => [
            'style' => $quoteStyle,
            'pairing' => $pairing,
            'legibility' => $quoteLegibility,
            'placement' => $quotePlacement,
        ],
    ];
}

function fallbackVisualParams(
    string $title,
    string $genre,
    string $pitch,
    int $variation,
    string $mode,
    ?array $previous,
    string $notes = ''
): array {
    $notes = clipConversationNotes($notes);
    $seedKey = $title . '|' . $genre . '|' . $pitch . '|' . $variation . '|' . $mode;
    if ($notes !== '') {
        $seedKey .= '|' . $notes;
    }
    $seed = abs(crc32($seedKey));
    $story = $notes === '' ? $pitch : trim($pitch . ' ' . $notes);
    $semantic = inferSemanticProfile($title, $genre, $story, $seed);

    if ($mode === 'improve' && is_array($previous)) {
        $family = (string) ($previous['grammarFamily'] ?? $semantic['grammarFamily']);
        $grammar = genreGrammar($family);
        $allowedMetaphors = $grammar['metaphors'] ?? FRAMEFLUX_METAPHORS;
        $allowedMaterials = $grammar['materials'] ?? FRAMEFLUX_MATERIALS;
        $semantic['grammarFamily'] = $family;
        $semantic['visualMetaphor'] = coerceToList(
            aliasedEnum((string) ($previous['visualMetaphor'] ?? $semantic['visualMetaphor']), FRAMEFLUX_METAPHOR_ALIASES, FRAMEFLUX_METAPHORS, $semantic['visualMetaphor']),
            $allowedMetaphors,
            $semantic['visualMetaphor']
        );
        $semantic['narrativeAnchor'] = $semantic['visualMetaphor'];
        $semantic['material'] = coerceToList(
            enumValue((string) ($previous['material'] ?? $semantic['material']), FRAMEFLUX_MATERIALS, $semantic['material']),
            $allowedMaterials,
            $semantic['material']
        );
        $semantic['emotionalCore'] = enumValue((string) ($previous['emotionalCore'] ?? $semantic['emotionalCore']), FRAMEFLUX_EMOTIONS, $semantic['emotionalCore']);
        $semantic['narrativeCore'] = enumValue((string) ($previous['narrativeCore'] ?? $semantic['narrativeCore']), FRAMEFLUX_NARRATIVES, $semantic['narrativeCore']);
        $semantic['humanElements'] = enumValue((string) ($previous['humanElements'] ?? $semantic['humanElements'] ?? 'none'), FRAMEFLUX_HUMAN_ELEMENTS, $semantic['humanElements'] ?? 'none');
        $semantic['groundTone'] = $grammar['groundTone'] ?? $semantic['groundTone'];
        $semantic['spatial'] = coerceToList(
            FRAMEFLUX_SPATIAL[($seed + 1) % count(FRAMEFLUX_SPATIAL)],
            $grammar['spatialFeelings'] ?? FRAMEFLUX_SPATIAL,
            $semantic['spatial']
        );
        $semantic['compositionGrammar'] = pickFromGrammar($grammar['compositionGrammars'] ?? COMPOSITION_GRAMMARS, $seed + 17);
        $semantic['compositionMode'] = enumValue((string) ($previous['compositionMode'] ?? $semantic['compositionMode'] ?? ''), COMPOSITION_MODES, $semantic['compositionMode'] ?? compositionModeFor($family, $semantic['compositionGrammar'], $seed));
        $semantic['artFamily'] = enumValue((string) ($previous['artFamily'] ?? $semantic['artFamily'] ?? ''), ART_FAMILIES, $semantic['artFamily'] ?? artFamilyFor($family, $semantic['visualMetaphor'], $semantic['proceduralFamily'] ?? 'organic', $seed));
        $semantic['narrativeEnergy'] = (float) ($previous['narrativeEnergy'] ?? $semantic['narrativeEnergy']);
    }

    if ($mode === 'reimagine' && is_array($previous)) {
        $family = (string) ($previous['grammarFamily'] ?? $semantic['grammarFamily']);
        $grammar = genreGrammar($family);
        $allowedMetaphors = $grammar['metaphors'] ?? FRAMEFLUX_METAPHORS;
        $allowedMaterials = $grammar['materials'] ?? FRAMEFLUX_MATERIALS;
        $semantic['grammarFamily'] = $family;
        $current = array_search($semantic['visualMetaphor'], $allowedMetaphors, true);
        $semantic['visualMetaphor'] = $allowedMetaphors[(($current === false ? 0 : $current) + 1 + ($seed % max(1, count($allowedMetaphors) - 1))) % count($allowedMetaphors)];
        $semantic['narrativeAnchor'] = $semantic['visualMetaphor'];
        $semantic['material'] = pickFromGrammar($allowedMaterials, $seed + 4);
        $semantic['spatial'] = pickFromGrammar($grammar['spatialFeelings'] ?? FRAMEFLUX_SPATIAL, $seed + 2);
        $semantic['compositionGrammar'] = pickFromGrammar($grammar['compositionGrammars'] ?? COMPOSITION_GRAMMARS, $seed + 8);
        $semantic['compositionMode'] = compositionModeFor($family, $semantic['compositionGrammar'], $seed + 13);
        $semantic['artFamily'] = artFamilyFor($family, $semantic['visualMetaphor'], $semantic['proceduralFamily'] ?? 'organic', $seed + 19);
        $semantic['groundTone'] = $grammar['groundTone'] ?? $semantic['groundTone'];
        $semantic['lightingStyle'] = pickFromGrammar($grammar['lightingStyles'] ?? FRAMEFLUX_LIGHTING, $seed + 41);
        $semantic['lineSemantics'] = pickFromGrammar($grammar['lineSemantics'] ?? FRAMEFLUX_LINE_SEMANTICS, $seed + 9);
        $semantic['particleSemantics'] = pickFromGrammar($grammar['particleSemantics'] ?? FRAMEFLUX_PARTICLE_SEMANTICS, $seed + 5);
        $semantic['humanElements'] = pickFromGrammar(($grammar['humanElements'] ?? []) !== [] ? $grammar['humanElements'] : ['none'], $seed + 37) ?: 'none';
    }

    $grammar = genreGrammar((string) $semantic['grammarFamily']);
    $preset = paletteFromGrammar($grammar, $seed);
    $ground = (string) ($semantic['groundTone'] ?? $grammar['groundTone'] ?? 'mid');
    $bg = $preset['bg'];
    $text = $preset['ink'];
    $accent = $preset['acc'];
    $highlight = $preset['hi'];
    $secondary = $preset['mute'];
    $primary = $preset['acc'];

    [$pattern, $secondPat] = patternForSemantic($semantic, $seed);
    $compositionMode = (string) ($semantic['compositionMode'] ?? compositionModeFor((string) $semantic['grammarFamily'], (string) ($semantic['compositionGrammar'] ?? 'central'), $seed));
    $layout = layoutFromCompositionMode($compositionMode, (string) $semantic['grammarFamily'], $seed);
    $titleStyle = match ($semantic['emotionalCore']) {
        'intimacy', 'nostalgia', 'grief', 'longing' => 'elegant',
        'urgency', 'paranoia', 'control' => 'condensed',
        'playfulness' => 'geometric',
        'wonder', 'triumph' => 'editorial',
        default => 'bold',
    };

    $lighting = aliasedEnum(
        (string) ($semantic['lightingStyle'] ?? ''),
        FRAMEFLUX_LIGHTING_ALIASES,
        FRAMEFLUX_LIGHTING,
        pickFromGrammar($grammar['lightingStyles'] ?? FRAMEFLUX_LIGHTING, $seed)
    );

    $camera = match ($semantic['spatial']) {
        'claustrophobic', 'compressed' => 'close',
        'expansive' => 'wide',
        'spiralling' => 'dutch',
        'isolated' => 'static',
        default => FRAMEFLUX_CAMERA[intdiv($seed, 5) % count(FRAMEFLUX_CAMERA)],
    };

    $energy = (float) ($semantic['narrativeEnergy'] ?? 0.5);
    $density = round(clamp(0.22 + $energy * 0.52 + (($seed % 9) / 100), 0.2, 0.85), 2);
    $shadow = $ground === 'light' ? 0.22 + ($seed % 12) / 100 : ($ground === 'mid' ? 0.38 + ($seed % 16) / 100 : 0.55 + ($seed % 22) / 100);
    $contrast = $lighting === 'high-key' ? 0.58 : ($lighting === 'chiaroscuro' || $lighting === 'hard-sun' ? 0.86 : 0.72);

    $comp = (string) ($semantic['compositionGrammar'] ?? 'central');
    $focalX = match ($comp) {
        'asymmetric', 'editorial', 'diagonal' => 0.34 + ($seed % 12) / 100,
        'crowded' => 0.46 + ($seed % 18) / 100,
        default => 0.44 + ($seed % 14) / 100,
    };
    $focalY = match ($comp) {
        'expansive', 'organic' => 0.4 + (($seed >> 3) % 10) / 100,
        'crowded', 'diagonal' => 0.46 + (($seed >> 3) % 16) / 100,
        'editorial' => 0.38 + (($seed >> 3) % 12) / 100,
        default => 0.4 + (($seed >> 3) % 14) / 100,
    };

    $typeDirection = inferTypographyDirection($semantic, $genre, $seed);
    $plate = fallbackCinematicPlate($semantic, $lighting);

    return [
        'palette' => [
            'background' => $bg,
            'primary' => $primary,
            'secondary' => $secondary,
            'accent' => $accent,
            'text' => $text,
            'highlight' => $highlight,
            'neutral' => $text,
        ],
        'pattern' => $pattern,
        'secondaryPattern' => $secondPat,
        'layout' => $layout,
        'titleTypographyDirection' => $typeDirection['title'],
        'quoteTypographyDirection' => $typeDirection['quote'],
        'mood' => $semantic['emotionalCore'] . ' · ' . $semantic['narrativeCore'],
        'quote' => fallbackQuote($title, $genre, $pitch, $seed),
        'density' => $density,
        'contrast' => $contrast,
        'titleStyle' => $titleStyle,
        'emotionalCore' => $semantic['emotionalCore'],
        'narrativeCore' => $semantic['narrativeCore'],
        'visualMetaphor' => $semantic['visualMetaphor'],
        'narrativeAnchor' => $semantic['narrativeAnchor'],
        'material' => $semantic['material'],
        'texture' => $semantic['texture'],
        'spatial' => $semantic['spatial'],
        'particleSemantics' => $semantic['particleSemantics'],
        'lineSemantics' => $semantic['lineSemantics'],
        'grammarFamily' => $semantic['grammarFamily'],
        'narrativeEnergy' => $energy,
        'compositionGrammar' => $comp,
        'compositionMode' => $semantic['compositionMode'] ?? compositionModeFor((string) $semantic['grammarFamily'], $comp, $seed),
        'artFamily' => $semantic['artFamily'] ?? artFamilyFor((string) $semantic['grammarFamily'], (string) $semantic['visualMetaphor'], (string) ($semantic['proceduralFamily'] ?? 'organic'), $seed),
        'proceduralFamily' => $semantic['proceduralFamily'] ?? 'organic',
        'proceduralSecondaryFamily' => $semantic['proceduralSecondaryFamily'] ?? 'tactile',
        'proceduralAccent' => $semantic['proceduralAccent'] ?? 'particle',
        'humanElements' => $semantic['humanElements'] ?? 'none',
        'groundTone' => $ground,
        'lightDirection' => 0.15 + ($seed % 70) / 100,
        'shadowDensity' => $shadow,
        'cinematic' => [
            'subject' => $plate['subject'],
            'environment' => $plate['environment'],
            'lighting' => $lighting,
            'atmosphere' => $plate['atmosphere'],
            'camera' => $camera,
            'tension' => round(clamp(0.2 + $energy * 0.55, 0, 1), 2),
            'intensity' => round(clamp(0.3 + $energy * 0.5, 0.2, 1), 2),
        ],
        'focalX' => $focalX,
        'focalY' => $focalY,
    ];
}

function normalizeParams(array $params, string $title, string $genre, string $pitch): array
{
    $warnings = [];

    $paletteIn = is_array($params['palette'] ?? null) ? $params['palette'] : [];
    $conceptIn = is_array($params['concept'] ?? null) ? $params['concept'] : [];
    $cinematicIn = is_array($params['cinematic'] ?? null) ? $params['cinematic'] : [];
    $compositionIn = is_array($params['composition'] ?? null) ? $params['composition'] : [];
    $proceduralIn = is_array($params['procedural'] ?? null) ? $params['procedural'] : [];
    $typographyIn = is_array($params['typography'] ?? null) ? $params['typography'] : [];
    $anchorsIn = is_array($params['anchors'] ?? null) ? $params['anchors'] : [];
    $semanticIn = is_array($params['semantic'] ?? null) ? $params['semantic'] : [];
    $lightingIn = is_array($params['lighting'] ?? null) ? $params['lighting'] : [];

    $rawPattern = (string) ($proceduralIn['primaryPattern'] ?? $params['pattern'] ?? 'flow');
    $primary = resolvePattern($rawPattern);
    if ($primary !== strtolower(trim($rawPattern)) && $rawPattern !== '') {
        $warnings[] = 'primaryPattern coerced';
    }

    $rawSecondary = (string) ($proceduralIn['secondaryPattern'] ?? $params['secondaryPattern'] ?? '');
    $secondary = $rawSecondary === '' ? nextPattern($primary) : resolvePattern($rawSecondary, nextPattern($primary));
    if ($secondary === $primary) {
        $secondary = nextPattern($primary);
        $warnings[] = 'secondaryPattern duplicated primary';
    }

    $titleStyle = enumValue(
        (string) ($typographyIn['titleStyle'] ?? $params['titleStyle'] ?? 'bold'),
        FRAMEFLUX_STYLES,
        'bold'
    );

    $quote = clipQuote((string) ($conceptIn['quote'] ?? $params['quote'] ?? ''));
    $mood = clipText((string) ($conceptIn['mood'] ?? $params['mood'] ?? 'cinematic'), 80, 'cinematic');

    $inferred = inferSemanticProfile(
        $title,
        $genre,
        $pitch,
        abs(crc32($title . '|' . $genre . '|' . $pitch))
    );

    $family = enumValue(
        (string) ($semanticIn['grammarFamily'] ?? $params['grammarFamily'] ?? $inferred['grammarFamily'] ?? ''),
        GENRE_FAMILIES,
        $inferred['grammarFamily']
    );
    $grammar = genreGrammar($family);

    $lighting = aliasedEnum(
        (string) ($cinematicIn['lighting'] ?? $lightingIn['type'] ?? $params['lighting'] ?? ''),
        FRAMEFLUX_LIGHTING_ALIASES,
        FRAMEFLUX_LIGHTING,
        (string) ($inferred['lightingStyle'] ?? 'practical')
    );
    $lighting = coerceToList($lighting, $grammar['lightingStyles'] ?? FRAMEFLUX_LIGHTING, (string) ($inferred['lightingStyle'] ?? 'practical'));
    $camera = enumValue(
        (string) ($cinematicIn['camera'] ?? ''),
        FRAMEFLUX_CAMERA,
        'wide'
    );

    $emotionalCore = enumValue(
        (string) ($semanticIn['emotionalCore'] ?? $params['emotionalCore'] ?? ''),
        FRAMEFLUX_EMOTIONS,
        $inferred['emotionalCore']
    );
    $narrativeCore = enumValue(
        (string) ($semanticIn['narrativeCore'] ?? $params['narrativeCore'] ?? ''),
        FRAMEFLUX_NARRATIVES,
        $inferred['narrativeCore']
    );
    $visualMetaphor = aliasedEnum(
        (string) ($semanticIn['visualMetaphor'] ?? $params['visualMetaphor'] ?? ''),
        FRAMEFLUX_METAPHOR_ALIASES,
        FRAMEFLUX_METAPHORS,
        $inferred['visualMetaphor']
    );
    if (!isTechFamily($family) && in_array($visualMetaphor, ['orbital-system', 'signal'], true)) {
        $visualMetaphor = $inferred['visualMetaphor'];
        $warnings[] = 'tech metaphor coerced';
    }
    // Production contract: narrativeAnchor is the same token as visualMetaphor.
    $narrativeAnchor = $visualMetaphor;
    $material = enumValue(
        (string) ($semanticIn['material'] ?? $params['material'] ?? ''),
        FRAMEFLUX_MATERIALS,
        $inferred['material']
    );
    $lightHuman = in_array($family, ['comedy', 'romance', 'contemporary', 'coming-of-age', 'family', 'animation', 'musical'], true);
    if ($lightHuman && !in_array($material, $grammar['materials'] ?? FRAMEFLUX_MATERIALS, true)
        && in_array($material, ['metal', 'plastic', 'concrete'], true)) {
        $material = $inferred['material'];
        $warnings[] = 'tech material coerced';
    }
    $texture = enumValue(
        (string) ($semanticIn['texture'] ?? $params['texture'] ?? ''),
        FRAMEFLUX_TEXTURES,
        $inferred['texture']
    );
    $spatial = enumValue(
        (string) ($semanticIn['spatial'] ?? $params['spatial'] ?? ''),
        FRAMEFLUX_SPATIAL,
        $inferred['spatial']
    );
    $particleSemantics = aliasedEnum(
        (string) ($semanticIn['particleSemantics'] ?? $params['particleSemantics'] ?? $proceduralIn['particleSemantics'] ?? ''),
        FRAMEFLUX_PARTICLE_ALIASES,
        FRAMEFLUX_PARTICLE_SEMANTICS,
        $inferred['particleSemantics']
    );
    $lineSemantics = aliasedEnum(
        (string) ($semanticIn['lineSemantics'] ?? $params['lineSemantics'] ?? $proceduralIn['lineSemantics'] ?? ''),
        FRAMEFLUX_LINE_ALIASES,
        FRAMEFLUX_LINE_SEMANTICS,
        $inferred['lineSemantics']
    );
    if (!isTechFamily($family) && in_array($lineSemantics, FRAMEFLUX_TECH_LINES, true)) {
        $lineSemantics = $inferred['lineSemantics'];
        $warnings[] = 'tech line language coerced';
    }

    $compositionGrammar = enumValue(
        (string) ($compositionIn['grammar'] ?? $params['compositionGrammar'] ?? $inferred['compositionGrammar'] ?? ''),
        COMPOSITION_GRAMMARS,
        $inferred['compositionGrammar'] ?? 'central'
    );
    $compositionMode = enumValue(
        (string) ($compositionIn['mode'] ?? $params['compositionMode'] ?? $inferred['compositionMode'] ?? ''),
        COMPOSITION_MODES,
        $inferred['compositionMode'] ?? compositionModeFor($family, $compositionGrammar, abs(crc32($title)))
    );
    $rawLayout = trim((string) ($compositionIn['layout'] ?? $params['layout'] ?? ''));
    if ($rawLayout !== '') {
        $layout = resolveLayout($rawLayout);
    } else {
        $layout = layoutFromCompositionMode($compositionMode, $family, abs(crc32($title . '|layout')));
    }
    $artFamily = enumValue(
        (string) ($semanticIn['artFamily'] ?? $params['artFamily'] ?? $inferred['artFamily'] ?? ''),
        ART_FAMILIES,
        $inferred['artFamily'] ?? artFamilyFor($family, (string) ($inferred['visualMetaphor'] ?? ''), $inferred['proceduralFamily'] ?? 'organic', abs(crc32($title . '|art')))
    );
    $printIn = is_array($params['print'] ?? null) ? $params['print'] : [];
    $printDefaults = printProfileFor($family, (float) ($params['narrativeEnergy'] ?? $inferred['narrativeEnergy'] ?? 0.5));
    $print = [
        'registration' => round(clamp((float) ($printIn['registration'] ?? $printDefaults['registration']), 0.05, 0.8), 2),
        'halftone' => round(clamp((float) ($printIn['halftone'] ?? $printDefaults['halftone']), 0.05, 0.8), 2),
        'scanlines' => round(clamp((float) ($printIn['scanlines'] ?? $printDefaults['scanlines']), 0.0, 0.6), 2),
        'grain' => round(clamp((float) ($printIn['grain'] ?? $printDefaults['grain']), 0.15, 0.9), 2),
    ];
    $negativeSpace = round(clamp((float) ($compositionIn['negativeSpace'] ?? $params['negativeSpace'] ?? $printDefaults['negativeSpace']), 0.15, 0.85), 2);
    $proceduralFamily = enumValue(
        (string) ($proceduralIn['family'] ?? $params['proceduralFamily'] ?? $inferred['proceduralFamily'] ?? ''),
        PROCEDURAL_FAMILIES,
        $inferred['proceduralFamily'] ?? 'organic'
    );
    $proceduralSecondaryFamily = enumValue(
        (string) ($proceduralIn['secondaryFamily'] ?? $params['proceduralSecondaryFamily'] ?? $inferred['proceduralSecondaryFamily'] ?? ''),
        PROCEDURAL_FAMILIES,
        $inferred['proceduralSecondaryFamily'] ?? 'tactile'
    );
    $proceduralAccent = enumValue(
        (string) ($proceduralIn['accent'] ?? $params['proceduralAccent'] ?? $inferred['proceduralAccent'] ?? ''),
        PROCEDURAL_FAMILIES,
        $inferred['proceduralAccent'] ?? 'particle'
    );
    $humanElements = enumValue(
        (string) ($semanticIn['humanElements'] ?? $params['humanElements'] ?? $inferred['humanElements'] ?? ''),
        FRAMEFLUX_HUMAN_ELEMENTS,
        $inferred['humanElements'] ?? 'none'
    );
    $groundTone = enumValue(
        (string) ($semanticIn['groundTone'] ?? $params['groundTone'] ?? $inferred['groundTone'] ?? 'mid'),
        ['light', 'mid', 'dark'],
        $inferred['groundTone'] ?? 'mid'
    );
    $narrativeEnergy = round(clamp((float) ($semanticIn['narrativeEnergy'] ?? $params['narrativeEnergy'] ?? $inferred['narrativeEnergy'] ?? 0.5), 0.05, 0.98), 2);

    if (!isTechFamily($family) && in_array($primary, FRAMEFLUX_TECH_PATTERNS, true)) {
        $primary = coerceToList('flow', $grammar['patterns'] ?? FRAMEFLUX_PATTERNS, 'flow');
        $warnings[] = 'tech pattern coerced';
    }
    if (!isTechFamily($family) && in_array($secondary, FRAMEFLUX_TECH_PATTERNS, true)) {
        $secondary = 'particles';
    }
    if ($secondary === $primary) {
        $secondary = nextPattern($primary);
        if ($secondary === $primary || (!isTechFamily($family) && in_array($secondary, FRAMEFLUX_TECH_PATTERNS, true))) {
            $secondary = $primary === 'flow' ? 'particles' : 'flow';
        }
    }
    if ($layout === 'frame-inset' && !isTechFamily($family)) {
        $layout = layoutForComposition($compositionGrammar, abs(crc32($title)), $family);
        $warnings[] = 'frame-inset reserved for tech families';
    }
    if ($family === 'comedy' && $layout === 'split-editorial') {
        $layout = layoutForComposition('asymmetric', abs(crc32($title)), $family);
        $warnings[] = 'comedy avoids split-editorial title column';
    }

    $focalX = clamp((float) ($compositionIn['focalX'] ?? $anchorsIn['focalX'] ?? $params['focalX'] ?? 0.5), 0.15, 0.85);
    $focalY = clamp((float) ($compositionIn['focalY'] ?? $anchorsIn['focalY'] ?? $params['focalY'] ?? 0.42), 0.15, 0.85);

    $density = round(clamp((float) ($proceduralIn['density'] ?? $params['density'] ?? 0.55), 0.2, 0.85), 2);
    $contrast = round(clamp((float) ($params['contrast'] ?? $proceduralIn['contrast'] ?? 0.75), 0.4, 1.0), 2);
    $intensity = round(clamp((float) ($cinematicIn['intensity'] ?? $proceduralIn['intensity'] ?? 0.55), 0.2, 1.0), 2);
    $tension = round(clamp((float) ($cinematicIn['tension'] ?? 0.5), 0.0, 1.0), 2);
    $materialEmphasis = round(clamp((float) ($params['materialEmphasis'] ?? $proceduralIn['materialEmphasis'] ?? 0.7), 0.3, 1.0), 2);
    $anchorScale = round(clamp((float) ($params['anchorScale'] ?? $compositionIn['anchorScale'] ?? 0.92), 0.7, 1.2), 2);
    $lightDirection = round(clamp((float) ($lightingIn['direction'] ?? $params['lightDirection'] ?? 0.35), 0.0, 1.0), 2);
    $shadowDensity = round(clamp((float) ($lightingIn['shadowDensity'] ?? $params['shadowDensity'] ?? 0.55), 0.2, 0.95), 2);

    $highlight = sanitizeHex((string) ($paletteIn['highlight'] ?? $paletteIn['accent'] ?? ''), '#e8c36a');
    $neutral = sanitizeHex((string) ($paletteIn['neutral'] ?? $paletteIn['text'] ?? ''), '#f5f0e6');
    $background = sanitizeHex((string) ($paletteIn['background'] ?? ''), '#111111');
    $primaryColor = sanitizeHex((string) ($paletteIn['primary'] ?? ''), '#884422');
    $secondaryColor = sanitizeHex((string) ($paletteIn['secondary'] ?? ''), '#336688');
    $accentColor = sanitizeHex((string) ($paletteIn['accent'] ?? ''), '#e8c36a');
    $textColor = sanitizeHex((string) ($paletteIn['text'] ?? ''), '#f5f0e6');

    $suppliedBg = sanitizeHex((string) ($paletteIn['background'] ?? ''), '');
    if ($suppliedBg !== '') {
        $lum = hexLuminance($suppliedBg);
        $storyLight = storySupportsAtmosphericLight($title, $genre, $pitch);
        if (!$storyLight && (($groundTone === 'light' && $lum < 0.38) || ($groundTone === 'dark' && $lum > 0.55))) {
            $preset = paletteFromGrammar($grammar, abs(crc32($title . '|' . $family)));
            $background = $preset['bg'];
            $primaryColor = $preset['acc'];
            $secondaryColor = $preset['mute'];
            $accentColor = $preset['acc'];
            $textColor = $preset['ink'];
            $highlight = $preset['hi'];
            $neutral = $preset['ink'];
            $warnings[] = 'palette coerced to genre ground';
        }
    }

    if ($groundTone === 'light') {
        $shadowDensity = min($shadowDensity, 0.42);
    }

    $inferredType = inferTypographyDirection(
        [
            'emotionalCore' => $emotionalCore,
            'narrativeCore' => $narrativeCore,
            'material' => $material,
            'texture' => $texture,
            'spatial' => $spatial,
            'grammarFamily' => $family,
        ],
        $genre,
        abs(crc32($title . '|' . $genre . '|type'))
    );

    $titleDirIn = is_array($typographyIn['title'] ?? null)
        ? $typographyIn['title']
        : (is_array($params['titleTypographyDirection'] ?? null) ? $params['titleTypographyDirection'] : []);
    $quoteDirIn = is_array($typographyIn['quote'] ?? null)
        ? $typographyIn['quote']
        : (is_array($params['quoteTypographyDirection'] ?? null) ? $params['quoteTypographyDirection'] : []);

    $titleDirection = [
        'weight' => enumValue((string) ($titleDirIn['weight'] ?? ''), FRAMEFLUX_TITLE_WEIGHTS, $inferredType['title']['weight']),
        'case' => enumValue((string) ($titleDirIn['case'] ?? ''), FRAMEFLUX_TITLE_CASES, $inferredType['title']['case']),
        'letterforms' => enumValue((string) ($titleDirIn['letterforms'] ?? ''), FRAMEFLUX_LETTERFORMS, $inferredType['title']['letterforms']),
        'tracking' => enumValue((string) ($titleDirIn['tracking'] ?? ''), FRAMEFLUX_TRACKING, $inferredType['title']['tracking']),
        'structure' => enumValue((string) ($titleDirIn['structure'] ?? ''), FRAMEFLUX_TITLE_STRUCTURES, $inferredType['title']['structure']),
        'placement' => enumValue((string) ($titleDirIn['placement'] ?? ''), FRAMEFLUX_TITLE_PLACEMENTS, $inferredType['title']['placement']),
    ];

    $quoteStyle = enumValue((string) ($quoteDirIn['style'] ?? ''), FRAMEFLUX_QUOTE_STYLES, $inferredType['quote']['style']);

    // The quote must never simply repeat the title face at a smaller size.
    $titleCategory = FRAMEFLUX_LETTERFORM_CATEGORY[$titleDirection['letterforms']] ?? 'sans';
    if ((FRAMEFLUX_QUOTE_STYLE_CATEGORY[$quoteStyle] ?? 'serif') === $titleCategory) {
        $quoteStyle = pickContrastingQuoteStyle(
            $titleCategory,
            [$inferredType['quote']['style']],
            abs(crc32($title . '|' . $genre . '|quote'))
        );
        $warnings[] = 'quoteStyle re-paired against title';
    }

    $quoteDirection = [
        'style' => $quoteStyle,
        'pairing' => (FRAMEFLUX_QUOTE_STYLE_CATEGORY[$quoteStyle] ?? 'serif') === $titleCategory ? 'complement' : 'contrast',
        'legibility' => enumValue(
            (string) ($quoteDirIn['legibility'] ?? ''),
            FRAMEFLUX_QUOTE_LEGIBILITY,
            $inferredType['quote']['legibility']
        ),
        'placement' => enumValue(
            (string) ($quoteDirIn['placement'] ?? ''),
            FRAMEFLUX_QUOTE_PLACEMENTS,
            $inferredType['quote']['placement']
        ),
    ];

    $plateFallback = fallbackCinematicPlate(
        [
            'narrativeAnchor' => $narrativeAnchor,
            'visualMetaphor' => $visualMetaphor,
            'material' => $material,
            'texture' => $texture,
            'spatial' => $spatial,
            'humanElements' => $humanElements,
            'grammarFamily' => $family,
            'groundTone' => $groundTone,
        ],
        $lighting
    );
    $cinematicSubject = ensureTextlessPlate(
        clipText((string) ($cinematicIn['subject'] ?? ''), 480, ''),
        $plateFallback['subject']
    );
    $cinematicEnvironment = ensureTextlessPlate(
        clipText((string) ($cinematicIn['environment'] ?? ''), 480, ''),
        $plateFallback['environment']
    );
    $cinematicAtmosphere = clipText(
        (string) ($cinematicIn['atmosphere'] ?? ''),
        180,
        $plateFallback['atmosphere']
    );

    return [
        'schemaVersion' => '1.3',
        'concept' => [
            'title' => $title,
            'genre' => $genre,
            'pitch' => $pitch,
            'mood' => $mood,
            'quote' => $quote,
        ],
        'semantic' => [
            'emotionalCore' => $emotionalCore,
            'narrativeCore' => $narrativeCore,
            'visualMetaphor' => $visualMetaphor,
            'narrativeAnchor' => $narrativeAnchor,
            'material' => $material,
            'texture' => $texture,
            'spatial' => $spatial,
            'particleSemantics' => $particleSemantics,
            'lineSemantics' => $lineSemantics,
            'grammarFamily' => $family,
            'narrativeEnergy' => $narrativeEnergy,
            'humanElements' => $humanElements,
            'groundTone' => $groundTone,
            'artFamily' => $artFamily,
        ],
        'cinematic' => [
            'subject' => $cinematicSubject,
            'environment' => $cinematicEnvironment,
            'lighting' => $lighting,
            'atmosphere' => $cinematicAtmosphere,
            'camera' => $camera,
            'tension' => $tension,
            'intensity' => $intensity,
        ],
        'palette' => [
            'background' => $background,
            'primary' => $primaryColor,
            'secondary' => $secondaryColor,
            'accent' => $accentColor,
            'text' => $textColor,
            'highlight' => $highlight,
            'neutral' => $neutral,
        ],
        'composition' => [
            'layout' => $layout,
            'grammar' => $compositionGrammar,
            'mode' => $compositionMode,
            'focalX' => $focalX,
            'focalY' => $focalY,
            'anchorScale' => $anchorScale,
            'negativeSpace' => $negativeSpace,
        ],
        'procedural' => [
            'primaryPattern' => $primary,
            'secondaryPattern' => $secondary,
            'family' => $proceduralFamily,
            'secondaryFamily' => $proceduralSecondaryFamily,
            'accent' => $proceduralAccent,
            'density' => $density,
            'intensity' => $intensity,
            'contrast' => $contrast,
            'materialEmphasis' => $materialEmphasis,
            'particleSemantics' => $particleSemantics,
            'lineSemantics' => $lineSemantics,
        ],
        'lighting' => [
            'type' => $lighting,
            'direction' => $lightDirection,
            'shadowDensity' => $shadowDensity,
        ],
        'print' => $print,
        'anchors' => [
            'protectTitle' => true,
            'protectSubject' => true,
            'focalX' => $focalX,
            'focalY' => $focalY,
            'narrativeAnchor' => $narrativeAnchor,
        ],
        'typography' => [
            'titleStyle' => $titleStyle,
            'tracking' => $titleStyle === 'condensed' ? -0.02 : ($titleStyle === 'elegant' ? 0.04 : 0),
            // Locked: genre is an input for interpretation, never poster copy.
            'genreVisibility' => 'hidden',
            'title' => $titleDirection,
            'quote' => $quoteDirection,
        ],
        'variation' => [
            'role' => 'signature',
        ],
        'warnings' => $warnings,
        'title' => $title,
        'genre' => $genre,
        'pitch' => $pitch,
        'mood' => $mood,
        'quote' => $quote,
        'pattern' => $primary,
        'layout' => $layout,
        'density' => $density,
        'contrast' => $contrast,
        'titleStyle' => $titleStyle,
    ];
}

function dnaShapePrompt(): string
{
    $emotions = implode(' | ', FRAMEFLUX_EMOTIONS);
    $narratives = implode(' | ', FRAMEFLUX_NARRATIVES);
    $metaphors = implode(' | ', FRAMEFLUX_METAPHORS);
    $materials = implode(' | ', FRAMEFLUX_MATERIALS);
    $textures = implode(' | ', FRAMEFLUX_TEXTURES);
    $spatial = implode(' | ', FRAMEFLUX_SPATIAL);
    $particles = implode(' | ', FRAMEFLUX_PARTICLE_SEMANTICS);
    $lines = implode(' | ', FRAMEFLUX_LINE_SEMANTICS);
    $humans = implode(' | ', FRAMEFLUX_HUMAN_ELEMENTS);
    $families = implode(' | ', GENRE_FAMILIES);
    $art = implode(' | ', ART_FAMILIES);
    $modes = implode(' | ', COMPOSITION_MODES);
    $patterns = implode(' | ', FRAMEFLUX_PATTERNS);
    $lighting = implode(' | ', FRAMEFLUX_LIGHTING);
    $camera = implode(' | ', FRAMEFLUX_CAMERA);
    $weights = implode(' | ', FRAMEFLUX_TITLE_WEIGHTS);
    $cases = implode(' | ', FRAMEFLUX_TITLE_CASES);
    $letterforms = implode(' | ', FRAMEFLUX_LETTERFORMS);
    $structures = implode(' | ', FRAMEFLUX_TITLE_STRUCTURES);
    $titlePlace = implode(' | ', FRAMEFLUX_TITLE_PLACEMENTS);
    $quoteStyles = implode(' | ', FRAMEFLUX_QUOTE_STYLES);
    $quoteLegibility = implode(' | ', FRAMEFLUX_QUOTE_LEGIBILITY);
    $quotePlace = implode(' | ', FRAMEFLUX_QUOTE_PLACEMENTS);

    return <<<SHAPE
{
  "schemaVersion": "1.3",
  "concept": {
    "title": "copy the supplied film title exactly",
    "genre": "copy the supplied genre exactly",
    "pitch": "copy the supplied pitch, or empty string",
    "mood": "short mood description",
    "quote": "short cinematic poster tagline, maximum 12 words"
  },
  "semantic": {
    "grammarFamily": "{$families}",
    "emotionalCore": "{$emotions}",
    "narrativeCore": "{$narratives}",
    "visualMetaphor": "{$metaphors}",
    "narrativeAnchor": "MUST equal visualMetaphor",
    "material": "{$materials}",
    "texture": "{$textures}",
    "spatial": "{$spatial}",
    "particleSemantics": "{$particles}",
    "lineSemantics": "{$lines}",
    "humanElements": "{$humans}",
    "groundTone": "light | mid | dark",
    "artFamily": "{$art}"
  },
  "cinematic": {
    "subject": "textless cinematic still subject for the image model — physical object, action, scale, perspective, materials; never a poster",
    "environment": "textless physical setting, architecture, terrain, depth, lighting conditions",
    "lighting": "{$lighting}",
    "atmosphere": "weather, haze, particulate, air",
    "camera": "{$camera}"
  },
  "palette": {
    "background": "#hex",
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "text": "#hex",
    "highlight": "#hex"
  },
  "composition": {
    "mode": "{$modes}",
    "negativeSpace": 0.15
  },
  "procedural": {
    "primaryPattern": "{$patterns}",
    "secondaryPattern": "{$patterns}",
    "density": 0.20
  },
  "typography": {
    "genreVisibility": "hidden",
    "title": {
      "weight": "{$weights}",
      "case": "{$cases}",
      "letterforms": "{$letterforms}",
      "structure": "{$structures}",
      "placement": "{$titlePlace}"
    },
    "quote": {
      "style": "{$quoteStyles}",
      "legibility": "{$quoteLegibility}",
      "placement": "{$quotePlace}"
    }
  }
}
SHAPE;
}

function dnaRulesPrompt(): string
{
    return <<<'RULES'
You are the FrameFlux Visual-DNA Architect. Translate ONE film (title + genre + optional pitch) into ONE nested Visual DNA v1.3 object.

ARCHITECTURE:
- One film = one semantic source of truth. Do not emit Signature, Hybrid, Alternative, Experimental, or any second DNA object. The frontend derives those three roles from this single object.
- Return only the production keys in the given shape. Do not add verification, concepts, artDirection, layoutStrategy, focalPoint, or other extra keys.
- Never invent enum values. If a richer idea will not fit a controlled field, express it in cinematic.subject / cinematic.environment / cinematic.atmosphere.
- concept.title, concept.genre, and concept.pitch must copy the supplied inputs. Do not rewrite the title. Do not replace the user-facing genre with grammarFamily.
- semantic.narrativeAnchor MUST equal semantic.visualMetaphor.

STORY FIRST, THEN GRAMMAR:
- Interpret the story: emotional core, conflict, stakes, environment, motifs. Do not illustrate only the literal plot.
- Genre is a visual grammar, not a colour, texture, or centred-object preset.
- Choose composition.mode from the story (duality → split-field, journey → edge-flow or diagonal, object/threshold → framed-object, restraint → quiet-minimal, layered information → editorial, kinetic conflict → diagonal, title as identity → type-dominant). Do not default to central-focus.
- Choose procedural.primaryPattern / secondaryPattern from meaning:
  flow for movement and organic drift;
  particles for atmosphere, pollen, dust, chaos;
  rings for cycles, orbits, and recurrences;
  grid/mesh only when the story is systemic or technological;
  halftone for print-process rhythm, comedy, musicals, animation, and graphic tactility;
  hatching for woodcut/engraving marks, terrain, adventure, historical, and geological tension;
  creases for folded paper, maps, letters, pressed sheets, and material deformation;
  marbling for viscous organic swirl, romance, contemporary interiors, and living canopies;
  sunburst for sunrise, revelation, spectacle, energy, and watchful animal or alpine silhouettes.
  Density is a number 0.20–0.85. negativeSpace is a number 0.15–0.85.
- Do not always pair flow+grid or grid+mesh.
- Nature and animal stories MUST use the matching controlled vocabulary when the story supports it:
  canine/dog → canine-silhouette or animal-tracks, fur or bone, paw-prints, animal-silhouette;
  mountains/peaks/alpine → mountain-ridge or alpine-peak, granite or slate, fault-lines;
  botanical/garden/forest → botanical-press, wild-canopy, or forest-fringe, bark or pressed-leaves, tendrils, flora.
  Do not convert a nature story into a generic human studio portrait.
- Do not treat halftone, hatching, creases, marbling, or sunburst as technology. grid and mesh remain the only technical patterns reserved for thriller, scifi, and horror.

TEXTLESS CINEMATIC PLATE:
- cinematic.subject and cinematic.environment describe a cinematic still photograph for a movie, NOT a poster.
- The image model never renders typography. Do not mention title placement, taglines, quotes, logos, credits, captions, HUD, UI, lettering, reserved space for type, REF:// labels, or reference identifiers.
- Language equivalent to: no typography, no titles, no captions, no logos, no credits, no UI — as a constraint, not as something to draw.
- Typography exists only under typography.title and typography.quote. typography.genreVisibility must be exactly "hidden".

QUOTE AND TYPE CONTRAST:
- concept.quote is a complete cinematic tagline, maximum 12 words, no genre name, no layout instructions.
- Title and quote must occupy different typographic categories (serif title → sans/mono/handwritten quote; sans title → editorial-italic/typewriter/handwritten; distressed → caption/cinematic-subtitle/typewriter). Never pair classical-serif with editorial-italic.

GENRE GROUNDING:
- comedy, romance, and contemporary strongly prefer groundTone "light" and a background luminance above 0.45 unless the story makes darkness unavoidable.
- grid, mesh, circuitry, and wiring are prohibited for comedy, romance, adventure, drama, and contemporary unless the story itself is about technology. They may appear for scifi, thriller, and horror when motivated.
- Comedy: playfulness, social friction, physical objects — not neon tech. Romance: intimacy/longing, paired objects, fabric/paper — not hearts or pink defaults. Adventure: terrain, route, scale — not a glowing abstract centre. Horror: absence, threshold, implied threat — not skulls or blood. Sci-fi: speculation appropriate to THIS story — not automatic neon circuitry.

ANTI-TEMPLATE:
- Would another genre naturally need a different composition.mode, metaphor, material, pattern, and spatial behaviour? If not, revise.
- Human elements only when necessary. Do not default to silhouette.

Return valid JSON only. No markdown. No prose before or after the object.
RULES;
}

/**
 * Soft quality guardrails — flags generic or conflicting DNA without blocking generation.
 */
function assessDnaQuality(array $dna): array
{
    $notes = [];
    $semantic = is_array($dna['semantic'] ?? null) ? $dna['semantic'] : [];
    $proc = is_array($dna['procedural'] ?? null) ? $dna['procedural'] : [];
    $density = (float) ($proc['density'] ?? $dna['density'] ?? 0.55);

    if ($density > 0.78) {
        $notes[] = 'density-high';
    }
    if (($semantic['visualMetaphor'] ?? '') === ($semantic['narrativeAnchor'] ?? '') && ($semantic['visualMetaphor'] ?? '') === 'silhouette-threshold') {
        $notes[] = 'anchor-generic';
    }
    if (!isTechFamily((string) ($semantic['grammarFamily'] ?? '')) && in_array($proc['primaryPattern'] ?? '', ['grid', 'mesh'], true)) {
        $notes[] = 'tech-pattern-on-human-genre';
    }
    $bg = (string) (($dna['palette']['background'] ?? ''));
    if (($semantic['groundTone'] ?? '') === 'light' && $bg !== '' && hexLuminance($bg) < 0.35) {
        $notes[] = 'light-genre-dark-ground';
    }

    $typography = is_array($dna['typography'] ?? null) ? $dna['typography'] : [];
    if (($typography['genreVisibility'] ?? '') !== 'hidden') {
        $notes[] = 'genre-visibility-unlocked';
    }
    if (($typography['quote']['pairing'] ?? 'contrast') !== 'contrast') {
        $notes[] = 'quote-pairing-not-contrasting';
    }
    if (($semantic['narrativeAnchor'] ?? '') !== ($semantic['visualMetaphor'] ?? '')) {
        $notes[] = 'narrative-anchor-mismatch';
    }
    $quoteText = (string) (($dna['concept']['quote'] ?? $dna['quote'] ?? ''));
    if ($quoteText !== '' && quoteWordCount($quoteText) > 12) {
        $notes[] = 'quote-over-twelve-words';
    }
    $cinematic = is_array($dna['cinematic'] ?? null) ? $dna['cinematic'] : [];
    if (plateLooksLikePosterCopy((string) ($cinematic['subject'] ?? '')) || plateLooksLikePosterCopy((string) ($cinematic['environment'] ?? ''))) {
        $notes[] = 'cinematic-plate-has-typography';
    }
    $mode = (string) (($dna['composition']['mode'] ?? ''));
    if ($mode !== '' && !in_array($mode, COMPOSITION_MODES, true)) {
        $notes[] = 'composition-mode-unknown';
    }

    $particle = $semantic['particleSemantics'] ?? '';
    $metaphor = $semantic['visualMetaphor'] ?? '';
    $expected = [
        'burning-document' => 'ash',
        'fractured-glass' => 'debris',
        'eclipse' => 'stars',
        'orbital-system' => 'stars',
        'map-fold' => 'dust',
    ];
    if (isset($expected[$metaphor]) && $particle !== '' && $particle !== $expected[$metaphor] && !in_array($particle, ['dust', 'grain'], true)) {
        // Soft note only — AI may choose intentionally.
        $notes[] = 'particle-metaphor-loose';
    }

    return $notes;
}
