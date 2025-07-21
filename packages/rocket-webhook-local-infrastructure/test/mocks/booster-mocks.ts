import { WebhookAPIResult, WebhookAPISuccessResult, WebhookAPIErrorResult, WebhookResponseType, HttpSuccessStatusCode } from '@boostercloud/rocket-webhook-types'
import { httpStatusCodeFor, toClassTitle } from '@boostercloud/framework-types'

export class BoosterMocks {
  static createSuccessResponse(body: unknown = 'test response', responseType: WebhookResponseType = WebhookResponseType.text, headers: Record<string, string> = {}): WebhookAPISuccessResult {
    return {
      status: HttpSuccessStatusCode,
      body,
      headers: {
        'Content-Type': responseType,
        ...headers
      }
    }
  }

  static createFileResponse(body: Buffer, fileName: string = 'test.txt', mimeType: string = 'text/plain'): WebhookAPISuccessResult {
    return {
      status: HttpSuccessStatusCode,
      body,
      headers: {
        'Content-Type': WebhookResponseType.file,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': body.length.toString()
      }
    }
  }

  static createJsonResponse(body: object): WebhookAPISuccessResult {
    return {
      status: HttpSuccessStatusCode,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': WebhookResponseType.json
      }
    }
  }

  static createErrorResponse(error: Error): WebhookAPIErrorResult {
    const statusCode = httpStatusCodeFor(error)
    return {
      status: statusCode,
      body: {
        title: toClassTitle(error),
        reason: error.message
      },
      headers: {
        'Content-Type': WebhookResponseType.json
      }
    }
  }

  static createBoosterRocketDispatcherMock(response: WebhookAPIResult) {
    return async (request: any): Promise<WebhookAPIResult> => {
      return response
    }
  }

  static createBoosterRocketDispatcherErrorMock(error: Error) {
    return async (request: any): Promise<never> => {
      throw error
    }
  }
}
