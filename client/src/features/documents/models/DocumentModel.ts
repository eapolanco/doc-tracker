import { type Document } from "@/types";

export class DocumentModel {
  static _name = "document";

  data: Document;

  constructor(data: Document) {
    this.data = data;
  }

  get id() {
    return this.data.id;
  }
  get name() {
    return this.data.name;
  }
  get category() {
    return this.data.category;
  }
  get path() {
    return this.data.path;
  }
  get cloudSource() {
    return this.data.cloudSource;
  }
  get status() {
    return this.data.status;
  }
  get lastModified() {
    return this.data.lastModified;
  }
  get uploadedAt() {
    return this.data.uploadedAt;
  }
  get type() {
    return this.data.type;
  }
  get fileSize() {
    return this.data.fileSize;
  }
  get tags() {
    return this.data.tags;
  }
  get encrypted() {
    return this.data.encrypted;
  }
  get isShared() {
    return this.data.isShared;
  }

  get formattedSize(): string {
    if (!this.data.fileSize) return "0 B";
    if (this.data.fileSize < 1024) return `${this.data.fileSize} B`;
    return `${(this.data.fileSize / 1024).toFixed(2)} KB`;
  }

  isValid(): boolean {
    return this.data.status === "valid";
  }

  static fromAPI(data: Document): DocumentModel {
    return new DocumentModel(data);
  }
}
