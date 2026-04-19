/**
 * Named exit codes for the wpdocs CLI.
 *
 * Using named constants makes intent clear and keeps exit-code semantics
 * consistent across every command.
 */

/** Command completed successfully. */
export const SUCCESS = 0;

/** Unexpected runtime error (uncaught exception, I/O failure, etc.). */
export const RUNTIME_ERROR = 1;

/** Invalid or missing configuration (bad config file, missing required flags). */
export const CONFIG_ERROR = 2;

/** Validation found errors (used by `wpdocs validate`). */
export const VALIDATION_FAILURE = 3;
