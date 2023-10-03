
export interface FontPosition {
    fontWidth: number;
    position: {
        x: number;
        y: number;
    };
    boxLength: number;
}

export interface ConfigRequest {
    bucketName: string;
    pdfconfig: {
      date: {
        year: number;
        fontPosition: FontPosition;
      };
      name: {
        name: string;
        fontPosition: FontPosition;
      };
    };
}