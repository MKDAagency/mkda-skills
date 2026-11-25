# MKDA Skills

Tre skill per Claude di [MKDA Digital Marketing Agency](https://mkdaagency.com). Lavorano con il **tuo** marchio e imparano dalle **tue** correzioni. [English](README.md)

| Skill | Cosa ottieni |
|---|---|
| `mkda-script` | script video pronti da girare, in un documento Word con le caselle da spuntare |
| `mkda-content` | caroselli, storie, reel e didascalie per Instagram |
| `mkda-proposals` | preventivi PDF 16:9 con i tuoi servizi e i tuoi prezzi |

## Installazione

**Claude Code** (terminale, scheda Code dell'app desktop, VS Code):

```
/plugin marketplace add MKDAagency/mkda-skills
/plugin install mkda@mkda-skills
```

Poi scrivi, per esempio, `/mkda:mkda-script` o "scrivi 5 script video per la mia attività".

**App Claude**: scarica lo zip della skill dalle [Release](https://github.com/MKDAagency/mkda-skills/releases) e caricalo nelle impostazioni delle skill. L'esecuzione del codice deve essere attiva. I video richiedono strumenti sul computer: nell'app puoi ricevere la regia scena per scena al posto del video finito.

## Come imparano

La prima volta la skill ti fa qualche domanda sul marchio e salva le risposte in `~/MKDA/`, sul tuo computer. Ogni correzione diventa una tua regola.

- **Basi MKDA**: il nostro metodo, che miglioriamo a ogni versione.
- **Il tuo livello**: marchio, voce, regole, prezzi. Lo cambi solo tu, vince sulle basi, gli aggiornamenti non lo toccano e resta anche se disinstalli.

Niente viene inviato a MKDA. Fai una copia della cartella `~/MKDA` per conservare ciò che hanno imparato. Nell'app Claude la skill ti restituisce `mkda-profile.md` aggiornato: mettilo nel tuo Progetto, altrimenti non se ne ricorderà.

## Aggiornamenti

Per i plugin di terzi gli aggiornamenti automatici sono spenti. Per accenderli: `/plugin`, **Marketplaces**, `mkda-skills`, attiva l'aggiornamento automatico. A mano: `/plugin marketplace update mkda-skills`, poi `/plugin update mkda@mkda-skills`. Nell'app si carica il nuovo zip.

## Cosa serve

- `mkda-script`: Python 3.9+, niente da installare.
- `mkda-proposals`: Python con Playwright, Pillow e pypdf.
- `mkda-content`: Node 22+, e ffmpeg per i video.

La skill controlla, spiega e chiede prima di installare. Le skill eseguono comandi sul tuo computer: leggile prima di installarle, come ogni plugin.

## Licenza

[Apache-2.0](LICENSE). Nome e logo MKDA esclusi. Gli aggiornamenti li pubblica solo MKDA.
