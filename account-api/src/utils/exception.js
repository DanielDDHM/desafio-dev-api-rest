export class AppError {
  body;
  statusCode;

  constructor(statusCode, body) {
    this.body = JSON.stringify(body);
    this.statusCode = statusCode;
  }
}
