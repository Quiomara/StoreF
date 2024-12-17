import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth'; // Base URL del endpoint de autenticación

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { correo: email, contrasena: password })
      .pipe(
        map(response => {
          if (response && response.token) {
            localStorage.setItem('token', response.token);
            return response;
          }
          throw new Error('Inicio de sesión fallido');
        }),
        catchError(error => {
          let errorMessage = 'Error desconocido. Por favor, inténtalo de nuevo.';
          if (error.status === 400) {
            errorMessage = error.error.error || 'Usuario o contraseña incorrectos.';
          } else if (error.status === 404) {
            errorMessage = error.error.error || 'Correo no registrado. Por favor contacta con un administrador.';
          } else if (error.status === 500) {
            errorMessage = 'Error en el servidor. Por favor, inténtalo de nuevo más tarde.';
          }
          return throwError({ message: errorMessage });
        })
      );
  }
  
    forgotPassword(email: string): Observable<any> {
      return this.http.post<any>(`${this.apiUrl}/forgot-password`, { correo: email })
        .pipe(
          map(response => {
            return response;
          }),
          catchError(error => {
            let errorMessage = 'Error desconocido. Por favor, inténtalo de nuevo.';
            if (error.status === 400) {
              errorMessage = error.error.error || 'Correo y contraseña son necesarios.';
            } else if (error.status === 404) {
              errorMessage = error.error.error || 'Usuario no registrado. Por favor contacta con un administrador.';
            } else if (error.status === 500) {
              errorMessage = 'Error en el servidor. Por favor, inténtalo de nuevo más tarde.';
            }
            return throwError({ message: errorMessage });
          })
        );
    }
  
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword })
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('Ocurrió un error:', error);
    return throwError(error);
  }
}



































