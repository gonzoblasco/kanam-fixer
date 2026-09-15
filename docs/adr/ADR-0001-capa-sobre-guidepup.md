# ADR-0001: Capa Propia Sobre Guidepup

**Status:** Aceptado
**Fecha:** 2026-09-15
**Contexto:** kanam-fixer 0.0.1 (BRIEF, 2026-09-14)

## Context

`Guidepup` automatiza lectores de pantalla reales: VoiceOver en macOS y NVDA en Windows. Su driver virtual (`@guidepup/virtual-screen-reader`) corre sin AT real, lo que permite ejecutar la misma asercion de anuncio en CI. El BRIEF del proyecto registra los datos verificados: MIT, activo (ultimo push 2026-09-13, `archived=false`), ~27.500 descargas semanales para el paquete principal y ~33.000 para el driver virtual.

Guidepup es una dependencia central del proyecto: es la unica via para automatizar lectores de pantalla reales desde Node. Pero las dependencias centrales tienen un riesgo propio: su API puede cambiar, el proyecto puede estancarse, o puede simplemente dejar de ser mantenido. Ese riesgo ya esta identificado en el BRIEF, seccion "Riesgos y restricciones": "el riesgo se mitiga con una capa propia fina sobre su API".

La pregunta que este ADR resuelve es si la API de Guidepup debe ser, ademas, el contrato publico de kanam-fixer.

## Decision

Construir una capa propia fina sobre Guidepup y exponer **solo esa capa** como contrato publico de kanam-fixer. La API de Guidepup nunca se exporta directamente hacia los usuarios del paquete.

El contrato publico de kanam-fixer es la asercion sobre el anuncio (la API que llega en S2 y siguientes): el usuario escribe que frase espera y en que plano corre, no como se conecta al lector. Los detalles de Guidepup (instancias, configuracion, manejo de foco) quedan dentro de la capa.

## Por que no exponer la API de Guidepup directa

- **El anuncio es el contrato, no el driver.** El valor del proyecto es la asercion sobre lo que se escucha, no la automatizacion del lector. Si el contrato publico es la API de Guidepup, el usuario queda atado a los detalles de un tercero para un problema que es nuestro.
- **Aislamiento ante cambios externos.** Si Guidepup cambia su API, se actualiza la capa y los usuarios no se enteran. Sin la capa, un cambio de version puede romper tests escritos por terceros contra nuestro paquete.
- **La matriz es nuestra, no de Guidepup.** El ADR-0002 declara el alcance (lector x version x SO) como compromiso nuestro. Ese compromiso solo tiene sentido si la superficie que los usuarios consumen es nuestra.
- **Sin capa, la promesa "misma asercion en dos planos" no se sostiene.** Virtual y real usan APIs distintas en Guidepup. La capa es donde se unifica: una asercion, dos drivers detras.

## Que pasa si Guidepup desaparece

- **El contrato publico no cambia.** La asercion sobre el anuncio sigue siendo la misma; solo cambia el driver detras de la capa.
- **El plano virtual es reemplazable.** `@guidepup/virtual-screen-reader` corre en CI y es la parte mas critica del ciclo. Ante la desaparicion del proyecto, se puede implementar el driver virtual propio (el protocolo es acotado: foco, teclas, lectura del arbol de accesibilidad) o adoptar un sustituto si aparece.
- **El plano real es el lado mas dificil de reemplazar.** No hay alternativa real publica para automatizar VoiceOver/NVDA desde Node. Si Guidepup desaparece sin sustituto, el plano real vuelve al flujo manual documentado (abrir el storybook, prender VoiceOver, escuchar) y la herramienta queda como asercion virtual. Esa degradacion esta aceptada: CI sigue cubierto, local pierde automatizacion.
- **La capa se mantiene fina.** Deliberadamente: cuanto menos logica propia acumule sobre Guidepup, mas barato es el reemplazo. La capa traduce asercion -> driver, no reimplementa comportamiento de lectores.

## Consecuencias

- Los usuarios importan desde nuestra API, nunca desde `@guidepup/*`.
- La capa absorbe cambios de version de Guidepup dentro del ciclo 0.0.1.
- El riesgo de desaparicion quedo mitigado por contrato (nuestra API) y por alcance (la capa es fina), no eliminado: el plano real sin Guidepup no tiene sustituto conocido hoy.
- Se declara en el README que kanam-fixer depende de Guidepup y que nuestra API es la unica superficie soportada.
