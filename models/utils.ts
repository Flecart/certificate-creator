
export interface DataOrError<T> { 
    | {
    data: T, 
    error: null
} | {
    data: T | null;
    error: string | null;
}
}