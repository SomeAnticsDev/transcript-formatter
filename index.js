import path from 'path';
import mammoth from 'mammoth';
import clipboardy from 'clipboardy';
import toTitleCase from 'titlecase';

if (process.argv.length < 3) {
	console.error('Must provide a filename');
	process.exit(1);
}

function formatSpeaker(speaker) {
	if (speaker === 'VOICEOVER:') return 'VoiceOver:';
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
		transcript = transcript.replace(/^(\[[\d:]+\] )?([A-Z ]+:)/gm, (match, timecode, speaker) => {
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