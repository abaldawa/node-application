/*
 * Author: Abhijit Baldawa
 *
 * Common error messages which can be used by all REST API's
 * */

exports.MISSING_INFO_MESSAGE = 'Required data was missing from the api';
exports.UNEXPECTED_ERROR_MESSAGE = 'An unexpected error has occurred. Please try again later';
exports.MISSING_SESSION_MESSAGE = 'Session ID in the header not found';
exports.EXPIRED_SESSION_MESSAGE = 'Session Expired';
exports.ACCOUNT_EXISTS_MESSAGE = 'An account with this email ID already exists';
exports.INVALID_INFO_MESSAGE = 'A parameter value in the API was not valid';
exports.NOT_FOUND_MESSAGE = 'Id was not found in database';