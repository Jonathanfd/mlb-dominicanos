# Respuesta sobre la API de MLB

**Sí, absolutamente.**

La aplicación está conectada a la **MLB Stats API oficial** (`statsapi.mlb.com`), que es la misma fuente de datos que utiliza la página oficial de la MLB.

## ¿Qué pasará cuando inicie la temporada?
1.  **Información en Vivo**: La API reporta cada pitcheo en tiempo real.
    *   *Nota*: Actualmente la app carga los datos al abrirse. Para ver los cambios en vivo sin recargar la página manualmente, se recomienda agregar un sistema de actualización automática (auto-refresh) antes del inicio de la temporada.
2.  **Datos Reales**: Toda la información de boxscores, lanzadores y bateadores vendrá directamente de los servidores de la MLB.
3.  **Detección de Dominicanos**: El sistema verifica el país de nacimiento (`birthCountry: "Dominican Republic"`) desde la API oficial, por lo que detectará automáticamente a los nuevos debutantes dominicanos, además de usar la lista de respaldo para casos especiales.

Así que tu aplicación estará lista para la acción desde el primer lanzamiento del Opening Day. ⚾🇩🇴
