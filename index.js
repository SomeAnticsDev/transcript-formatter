import path from 'path';
import mammoth from 'mammoth';
import clipboardy from 'clipboardy';
import toTitleCase from 'titlecase';

if (process.argv.length < 3) {
	console.error('Must provide a filename');
	process.exit(1);
}

/**
 * Map of custom labels for speakers whose names defy standard capitalization rules,
 * or for cases where the docs speaker label should be different from the captions speaker label.
 * @type {Object<string, string>}
 */
const SPEAKER_OVERRIDES = {
	'B. HOLMES:': 'Ben Holmes:',
	'B. MYERS:': 'Ben Myers:',
	'VOICEOVER': 'VoiceOver:'
};

/**
 * Titlecases a speaker label, or supplies an override.
 * @param {string} speaker Speaker label in all uppercase, followed by a colon
 * @returns {string} Speaker label formatted in titlecase
 */
function formatSpeaker(speaker) {
	if (SPEAKER_OVERRIDES[speaker]) {
		return SPEAKER_OVERRIDES[speaker];
	}

	return toTitleCase(speaker.toLowerCase());
}

const filename = path.join(process.cwd(), process.argv[2]);

mammoth.extractRawText({path: filename})
	.then((result) => {
		/** @type {String} */
		let transcript = result.value;

		// Trim
		transcript = transcript.trim();
		transcript = transcript.replace(/.*[.\n]*\[00:00:00] /g, '');

		// Titlecase and bold speaker names
		transcript = transcript.replace(/^(\[[\d:]+\] )?([A-Z \.]+:)/gm, (match, timecode, speaker) => {
			let formattedSpeaker = formatSpeaker(speaker);
			if (timecode) {
				return `${timecode.trim()} **${formattedSpeaker}**`;
			}
			return `**${formattedSpeaker}**`;
		});

		// Escape HTML tags as inline code
		transcript = transcript.replace(/(?<!`)(?<tag><[^\n>]+>)(?!`)/gm, '`$<tag>`');

		// Italicize timecodes and bracketed parentheticals
		transcript = transcript.replace(/(?<timecode>\[[\d:]+\])/g, '<i class="timecode">$<timecode></i>');
		transcript = transcript.replace(/(?<brackets>\[[^:]+\])/g, '<i class="brackets">$<brackets></i>');

		clipboardy.write(transcript)
			.then(() => console.log('Copied formatted transcript to clipboard!'))
			.catch(console.error);
	})