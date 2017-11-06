
# Patreas

## Υπολογισμός του Ranking List σε μια σειρά ιστιοδρομιών

Η βαθμολογία της θέσης του κάθε σκάφους προκύπτει από τον τύπο
### Score = sqrt(S*M/(R+2)) * 100 * B
όπου:
- S = Πλήθος κανονικώς εκκινησάντων σκαφών
- R = θέση τερματισμού του σκάφους
- Μ = Συντελεστής απόστασης, με τιμή 25 για τις ιστιοδρομίες Ελεγχόμενου Στίβου, το δε μήκος της ιστιοδρομίας σε ναυτικά μίλια στρογγυλοποιημένο στον πλησιέστερο ακέραιο για τις ιστιοδρομίες Ελεύθερης Πλεύσης
- B = Συντελεστής βαρύτητας, όπου για λόγους απλότητας θα ισούται με 1.00 

## Ευχαριστίες
 Based on [sindresorhus/electron-boilerplate](https://github.com/sindresorhus/electron-boilerplate)
 

## Dev

```
$ npm install
```

### Run

```
$ npm start
```

### Build

```
$ npm run build
```

Builds the app for macOS, Linux, and Windows, using [electron-packager](https://github.com/electron-userland/electron-packager).


