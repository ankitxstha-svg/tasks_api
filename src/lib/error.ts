export const ErrorCode ={
    BAD_REQUEST: "BAD_REQUEST",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    CONFLICT: "CONFLICT"
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export function errorResponse(code: ErrorCode, message: string){
    return {error: code, message};
}