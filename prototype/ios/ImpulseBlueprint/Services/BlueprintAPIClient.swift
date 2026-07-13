import Foundation

enum BlueprintAPIError: LocalizedError {
    case invalidResponse
    case server(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "The server sent back something I didn't expect."
        case .server(let message):
            return message
        }
    }
}

/// The one backend call in this prototype: full transcript in, Human Blueprint out.
/// No auth beyond the Supabase anon key, no intermediate calls — see
/// prototype/backend/supabase/functions/generate-blueprint/index.ts for the other side.
struct BlueprintAPIClient {
    let baseURL: URL
    let anonKey: String

    func generateBlueprint(transcript: [TranscriptTurn]) async throws -> BlueprintResponse {
        var request = URLRequest(url: baseURL.appendingPathComponent("functions/v1/generate-blueprint"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(["transcript": transcript])

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw BlueprintAPIError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            let message = (try? JSONDecoder().decode([String: String].self, from: data))?["error"]
                ?? String(data: data, encoding: .utf8)
                ?? "The request failed (status \(http.statusCode))."
            throw BlueprintAPIError.server(message)
        }

        return try JSONDecoder().decode(BlueprintResponse.self, from: data)
    }
}
