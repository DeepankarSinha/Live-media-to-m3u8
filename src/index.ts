import Ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import * as fs from 'fs';
import { clearInterval } from 'timers';

export default class LiveMediaToM3u8 {

	private readonly INTERVAL_TIME = 1000;

	private sources: string[] = [];
	private isRunning: boolean = false;
	private interval: NodeJS.Timeout | undefined = undefined;
	private command: FfmpegCommand | undefined = undefined;
	private additionalFfmpegOptions: string[] = [];

	public enableLog: boolean = false;
	public get getSources() { return this.sources; }
	public get getDestination() { return this.destination }

	/**
	 * Initialize Live Media to M3u8.
	 * @param destination Path of the destination.
	 */
	constructor(private destination: string) { }

	/**
	 * Add a path to the source.
	 * @description Ffmpeg command will run for each source. 
	 * @param source Path of the source.
	 */
	addSource(source: string) {
		this.sources.push(source);
	}

	/**
	 * Start converting.
	 */
	start(): void {
		if (this.interval) {
			return;
		}

		this.interval = setInterval(() => {
			if (!this.isRunning) {
				const source = this.sources.shift();

				if (!source) {
					return;
				}

				this.convert(source);
			}
		}, this.INTERVAL_TIME);
	}

	/**
	 * Stop the convertion process immediately.
	 */
	kill() {
		this.interval && clearInterval(this.interval);
		this.command && this.command.kill('9');
	}

	/**
	 * Convert input file.
	 * @param input Input file.
	 */
	private convert(input: string) {
		this.isRunning = true;
		this.runFfmpeg(input, this.destination)
		.catch(err => {
			throw err;
		})
		.finally(() => {
			this.isRunning = false;
		});
	}

	/**
	 * Run Ffmpeg command.
	 * @param source Input file path.
	 * @param destination Destination file path.
	 */
	private runFfmpeg(source: string, destination: string) {
		return new Promise<void>((resolve, reject) => {
			this.command = Ffmpeg(fs.createReadStream(source));
			this.command
			.native()
			.addOptions([
				'-f hls',
				'-hls_time 2',
				'-hls_list_size 5',
				'-hls_flags append_list+omit_endlist+delete_segments',
				...this.additionalFfmpegOptions
			])
			.output(fs.createWriteStream(destination))
			.run()

			this.command.on('start', cmd => {
				this.enableLog && console.log(cmd);
			});

			this.command.on('error', (err, stdout, stderr) => {
				this.enableLog && console.error(err, stdout, stderr);
				this.isRunning = false;
				reject(err);
			});

			this.command.on('end', () => {
				this.isRunning = false;
				resolve();
			});
		});
	}
}
