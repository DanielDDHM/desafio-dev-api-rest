export class PresenterFactory {
  body;
  messages;
  statusCode;

  constructor(statusCode, body, messages) {
    this.statusCode = statusCode;
    this.body = JSON.stringify({
      ...body,
      message: messages,
    });
  }
}
