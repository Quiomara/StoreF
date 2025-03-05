import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageUploadService {
  private uploadUrl = 'http://localhost:3000/api/upload'; // URL de subida

  constructor(private http: HttpClient) {}

  /**
   * Sube una imagen al servidor.
   * @param {File} file - Archivo de imagen a subir.
   * @returns {Observable<any>} - Respuesta del servidor.
   */
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(this.uploadUrl, formData);
  }
}
