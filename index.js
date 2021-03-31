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

		// Titlecase and bold speaker names
		transcript = transcript.replace(/^(\[[\d:]+\] )?([A-Z ]+:)/gm, (match, timecode, speaker) => {
			let formattedSpeaker = formatSpeaker(speaker);
			if (timecode) {
				return `${timecode.trim()} **${formattedSpeaker}**`;
			}
			return `**${formattedSpeaker}**`;
		});

		// Italicize timecodes and bracketed parentheticals
		transcript = transcript.replace(/(?<brackets>\[[^\n]+\])/g, '*$<brackets>*');

		// Escape HTML tags as inline code
		transcript = transcript.replace(/(?<!`)(?<tag><[^\n>]+>)(?!`)/g, '`$<tag>`');

		clipboardy.write(transcript)
			.then(() => console.log('Copied formatted transcript to clipboard!'))
			.catch(console.error);
	})