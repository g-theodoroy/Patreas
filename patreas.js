var fs = require('fs')
var path = require('path')
var xml2js = require('xml2js')
var firstBy = require('thenby')
var _ = require('underscore')
var openurl = require('openurl')
var glob = require('glob')

// Βρίσκω το φάκελο Αποθήκευσης
const {app} = require('electron').remote
var userDataPath = app.getPath('userData')

// ορισμός αρχείων
var katxml = 'katigories.xml'
var istxml = 'istiodromies.xml'
var yachtxml = 'yachts.xml'

var counter

var scoreDef = {
  1: 'DNF',
  2: 'DNC',
  3: 'DNS',
  4: 'OCS',
  5: 'BFD',
  6: 'RET',
  7: 'DSQ',
  8: 'DNE',
  10: 'ZFP',
  11: 'UFD',
  12: 'SCP',
  13: 'RDG',
  14: 'DPI'
}

var nm4eleghomenes = 25

// ----- ΓΕΝΙΚΕΣ functions ------

// Φορτώνει το αρχείο xml σε obj
function xmlFileToJs (filename, fullpath, cb) {
  var filepath
  if (fullpath) {
    filepath = filename
  } else {
    filepath = path.normalize(path.join(userDataPath, filename))
  }
  fs.readFile(filepath, 'utf8', function (err, xmlStr) {
    if (err) throw (err)
    xml2js.parseString(xmlStr, {}, cb)
  })
}

// Αποθηκεύει το obj σε αρχείο xml
function jsToXmlFile (filename, obj, cb) {
  var filepath = path.normalize(path.join(userDataPath, filename))
  var builder = new xml2js.Builder()
  var xml = builder.buildObject(obj)
  fs.writeFile(filepath, xml, cb)
}

// --- ΚΑΤΗΓΟΡΙΕΣ --------

// αν στην αρχή θέλω να γεμίσω τη λίστα με τις κατηγορίες
// το κάνω  populateatstart = true
let populateatstart = false
if (populateatstart) {
  var obj = {
    'katigories': {
      'katigoria': [
            {'onoma': 'ORC INTERNATIONAL', 'id': 'INT'},
            {'onoma': 'ORC CLUB', 'id': 'CLUB'},
            {'onoma': 'IRC', 'id': 'IRC'}
      ]
    }
  }
  jsToXmlFile(katxml, obj, function (err) {
    if (err) throw (err)
  })
}

// δημιουργία από το xml των εγγραφών για τις κατηγορίες
function katlistdata (obj, callback) {
  var katHtml = ''
  var idx
  var colorclass
  counter = 1
  obj.katigories.katigoria.forEach(function (item) {
    idx = obj.katigories.katigoria.findIndex(x => x.id === item.id)
    if (counter % 2) { colorclass = '' } else { colorclass = 'bg-grey' }
    katHtml = katHtml + '\n<div class="row ' + colorclass + '">\n' +
    '<div class="form-control-static col-md-1 col-sm-1 col-xs-1 col-md-offset-1 col-sm-offset-1 col-xs-offset-1 text-right">' + counter + '</div>\n' +
    '<div class="form-control-static col-md-4 col-sm-4 col-xs-4">' + item.onoma + '</div>\n' +
      '<div class="form-control-static col-md-3 col-sm-3 col-xs-3 ">' + item.id + '</div>\n' +
      '<div class="col-md-2 col-sm-2 col-xs-2 text-center">\n' +
      ' <a href="javascript:window.patreas.katedit(' + idx + ');" class="form-control-static" role="button" title="Επεξεργασία ' + item.onoma + '" > <img src="images/edit.ico" height="20" /></a>\n' +
      ' <a href="javascript:window.patreas.katdelete(' + idx + ');" class="form-control-static" role="button" title="Διαγραφή ' + item.onoma + '" > <img src="images/delete.ico" height="20" /></a>\n' +
      '</div>\n' +
      '</div>\n'
    counter = counter + 1
  })
  callback(katHtml)
}

// τοποθετεί στην div με id="kat-list" τα δεδομένα
// που παίρνει από τη katlistdata
exports.getKatList = function getKatList () {
  xmlFileToJs(katxml, false, function (err, obj) {
    if (err) throw (err)
    if (obj) {
      katlistdata(obj, function (katHtml) {
        window.jQuery('#kat-list').html(katHtml)
      })
    } else {
      window.jQuery('#kat-list').html('')
    }
  })
}

// γεμίζει τα inputbox με τις τιμές για Επεξεργασία
exports.katedit = function katedit (idx) { // eslint-disable-line no-unused-vars
  xmlFileToJs(katxml, false, function (err, obj) {
    if (err) throw (err)
    if (obj) {
      window.jQuery('#katigoria').val(obj.katigories.katigoria[idx].onoma)
      window.jQuery('#kat').val(obj.katigories.katigoria[idx].id)
      window.jQuery('#katid').val(idx)
    }
  })
}

// Ανανεώνει τη λίστα των κατηγοριών
// μετά από καταχώρηση, επεξεργασία, διαγραφή
function katrefresh (file, obj) {
  if (!obj) {
    var filename = path.normalize(path.join(userDataPath, katxml))
    fs.writeFile(filename, '', function (err) {
      if (err) console.log(err)
      console.log('The file ' + filename + ' was saved!')
    })
  } else {
    // ταξινομηση με βάση πεδία
    if (obj.katigories.katigoria.length) {
      obj.katigories.katigoria.sort(
      firstBy('id')
      )
    }
    jsToXmlFile(file, obj, function (err) {
      if (err) throw (err)
    })
  }
  window.patreas.getKatList()
  window.patreas.katclear()
}

// Διαγραφή Κατηγορίας
exports.katdelete = function katdelete (index) { // eslint-disable-line no-unused-vars
  xmlFileToJs(katxml, false, function (err, obj) {
    if (err) throw (err)
    if (!window.confirm('Διαγραφή του ' + obj.katigories.katigoria[index].onoma + ';')) {
      return
    }
    if (obj.katigories.katigoria.length > 1) {
      obj.katigories.katigoria.splice(index, 1)
    } else {
      obj = null
    }
    katrefresh(katxml, obj)
  })
}

// Καθάρισμα των inputbox
exports.katclear = function katclear () {
  window.jQuery('#katigoria').val('')
  window.jQuery('#kat').val('')
  window.jQuery('#katid').val('')
}

// αποθηκεύει την Επεξεργασία
// ή Νέα εγγραφή αν δεν υπάρχει ίδια Συντομογραφία Κατηγορίας
exports.katsave = function katsave () { // eslint-disable-line no-unused-vars
  var katigoria = window.jQuery('#katigoria').val().trim()
  var kat = window.jQuery('#kat').val().trim().toUpperCase()
  var katid = window.jQuery('#katid').val().trim()

  if (!katigoria || !kat) {
    window.alert('Τα πεδία "Κατηγορία" και "Κωδικός" δεν πρέπει να είναι κενά.')
    return
  }
  xmlFileToJs(katxml, false, function (err, obj) {
    if (err) throw (err)
    if (!obj) {
      obj = {
        'katigories': {
          'katigoria':
                {'onoma': katigoria, 'id': kat}
        }
      }
    } else {
      if (katid) {
        let saveok = true
        obj.katigories.katigoria.forEach(function (item) {
          if (item.id === kat && katid !== obj.katigories.katigoria.findIndex(x => x.id === item.id)) {
            window.alert('Υπάρχει ήδη καταχωρισμένη Κατηγορία με Κωδικό ' + kat + '.')
            saveok = false
          }
        })
        if (saveok) {
          obj.katigories.katigoria[katid].onoma = katigoria
          obj.katigories.katigoria[katid].id = kat
        }
      } else {
        let saveok = true
        obj.katigories.katigoria.forEach(function (item) {
          if (item.id == kat) { // eslint-disable-line eqeqeq
            window.alert('Υπάρχει ήδη καταχωρισμένη Κατηγορία με Κωδικό ' + kat + '.')
            saveok = false
          }
        })
        if (saveok) {
          obj.katigories.katigoria.push({'onoma': katigoria, 'id': kat})
        }
      }
    }
    katrefresh(katxml, obj)
  })
}

// ------ ΙΣΤΙΟΔΡΟΜΙΕΣ --------

// δημιουργία από το xml των εγγραφών για τις κατηγορίες
function istlistdata (obj, callback) {
  var istHtml = ''
  var idx
  var istchkchecked
  counter = 1
  var colorclass
  xmlFileToJs(katxml, false, function (err, objkat) {
    if (err) throw (err)
    objkat.katigories.katigoria.forEach(function (itemkat) {
      if (_.filter(obj.istiodromies.istiodromia, function (item) { return item.istkat == itemkat.id[0] }).length) { // eslint-disable-line eqeqeq
        istHtml = istHtml +
      '<div class="row">' +
      '<div class="form-control-static  col-md-12 col-sm-12 col-xs-12 text-center bg-primary h3">' + itemkat.onoma + '</div>' +
      '</div>' +
      '<div class="row">' +
        '<div class="form-control-static  col-md-5 col-sm-5 col-xs-5 text-right h4">Να προσμετρηθούν </div>' +
        '<div class="col-md-2 col-sm-2 col-xs-2 h4">' +
          '<input id="istnum' + itemkat.id + '" type="text" class="form-control text-center" name="istnum' + itemkat.id + '"  placeholder="Αρ" value="">' +
        '</div>' +
        '<div class="form-control-static col-md-3 col-sm-3 col-xs-3 text-left h4"> ιστιοδρομίες</div>' +
        '<div class="col-md-2 col-sm-2 col-xs-2 text-center h4">' +
          '<a href="javascript:window.patreas.istnumsave(\'istnum' + itemkat.id[0] + '\');" class="form-control-static" role="button" title="Αποθήκευση" > <img src="images/save.ico" height="25" /></a>' +
        '</div>' +
      '</div>'
      }
      obj.istiodromies.istiodromia.forEach(function (item) {
        idx = obj.istiodromies.istiodromia.findIndex(x => x.id === item.id)
        var idxistyacht = _.filter(obj.istiodromies.istiodromia, function (myitem) {
          return myitem.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
        }).findIndex(x => x.id === item.id)
        if (item.eleghomenosStivos) { istchkchecked = 'checked' } else { istchkchecked = '' }
        if (itemkat.id == item.istkat[0]) { // eslint-disable-line eqeqeq
          if (counter % 2) { colorclass = '' } else { colorclass = 'bg-grey' }
          istHtml = istHtml + '\n<div class="row ' + colorclass + '">\n' +
      '<div class="form-control-static col-md-1 col-sm-1 col-xs-1 text-right ">' + counter + '</div>\n' +
      '<div class="form-control-static col-md-3 col-sm-3 col-xs-3 ">' + item.onoma + '</div>\n' +
      '<div class="form-control-static col-md-2 col-sm-2 col-xs-2 ">' + item.ist + '</div>\n' +
      '<div class="form-control-static col-md-1 col-sm-1 col-xs-1 text-center">' + item.nm + '</div>\n' +
      '<div class="form-control-static col-md-1 col-sm-1 col-xs-1 text-center ">' + item.baritita + '</div>\n' +
      '<div class="form-control-static col-md-1 col-sm-1 col-xs-1 text-center">' + item.istkat + '</div>\n' +
      '<div class="form-control-static col-md-1 col-sm-1 col-xs-1 text-center"><input type="checkbox" id="istchk' + idx + '" value="' + idx + '" onclick="window.patreas.istchkupdate(this, ' + idx + ')"' + istchkchecked + '></div>\n' +
      '<div class="col-md-2 col-sm-2 col-xs-2 text-center">\n' +
      ' <a href="javascript:window.patreas.istedit(' + idx + ');" class="form-control-static" role="button" title="Επεξεργασία ' + item.onoma + '" > <img src="images/edit.ico" height="20" /></a>\n' +
      ' <a href="javascript:window.patreas.istdelete(' + idx + ', ' + idxistyacht + ');" class="form-control-static" role="button" title="Διαγραφή ' + item.onoma + '" > <img src="images/delete.ico" height="20" /></a>\n' +
      '</div>\n' +
      '</div>\n'
          counter = counter + 1
        }
      })
      counter = 1
    })
    callback(istHtml)
  })
}

// τοποθετεί στην div με id="ist-list" τα δεδομένα
// που παίρνει από τη istlistdata
exports.getistList = function getistList () {
  xmlFileToJs(istxml, false, function (err, obj) {
    if (err) throw (err)
    if (obj) {
      if (obj.istiodromies.istiodromia) {
        istlistdata(obj, function (istHtml) {
          window.jQuery('#ist-list').html(istHtml)
        })
      }
      xmlFileToJs(katxml, false, function (err, objkat) {
        if (err) throw (err)
        objkat.katigories.katigoria.forEach(function (itemkat) {
          if (obj.istiodromies['istnum' + itemkat.id[0]]) {
            window.jQuery('#istnum' + itemkat.id[0]).val(obj.istiodromies['istnum' + itemkat.id[0]])
          }
        })
      })
      if (obj.istiodromies.nm_eleghomenes) {
        window.jQuery('#nm_eleghomenes').val(obj.istiodromies.nm_eleghomenes)
      }
    } else {
      window.jQuery('#ist-list').html('')
    }
  })
  xmlFileToJs(katxml, false, function (err, obj) {
    if (err) throw (err)
    if (obj) {
      katselectdata(obj, 'istkatid', function (katselect) {
        window.jQuery('#istkatdiv').html(katselect)
      })
    }
  })
}

exports.istchkupdate = function istchkupdate (element, istindex) {
  xmlFileToJs(istxml, false, function (err, obj) {
    if (err) throw (err)
    if (element.checked) {
      obj.istiodromies.istiodromia[istindex].eleghomenosStivos = element.checked
    } else {
      delete obj.istiodromies.istiodromia[istindex].eleghomenosStivos
    }
    jsToXmlFile(istxml, obj, function (err) {
      if (err) throw (err)
    })
  })
}

// γεμίζει τα inputbox με τις τιμές για Επεξεργασία
exports.istedit = function istedit (idx) { // eslint-disable-line no-unused-vars
  xmlFileToJs(istxml, false, function (err, obj) {
    if (err) throw (err)
    if (obj) {
      window.jQuery('#istiodromia').val(obj.istiodromies.istiodromia[idx].onoma)
      window.jQuery('#ist').val(obj.istiodromies.istiodromia[idx].ist)
      window.jQuery('#istid').val(idx)
      window.jQuery('#nm').val(obj.istiodromies.istiodromia[idx].nm)
      window.jQuery('#baritita').val(obj.istiodromies.istiodromia[idx].baritita)
      window.jQuery('#istkatid').val(obj.istiodromies.istiodromia[idx].istkat)
    }
  })
}

// Ανανεώνει τη λίστα των κατηγοριών
// μετά από καταχώρηση, επεξεργασία, διαγραφή
function istrefresh (file, obj) {
  if (!obj) {
    var filename = path.normalize(path.join(userDataPath, istxml))
    fs.writeFile(filename, '', function (err) {
      if (err) console.log(err)
      console.log('The file ' + filename + ' was saved!')
    })
  } else {
    obj.istiodromies.istiodromia.sort(
      firstBy('istkat')
      .thenBy('datetime')
    )
    jsToXmlFile(file, obj, function (err) {
      if (err) throw (err)
    })
  }
  window.patreas.getistList()
  window.patreas.istclear()
}

// Διαγραφή Κατηγορίας
exports.istdelete = function istdelete (index, indexistyacht) { // eslint-disable-line no-unused-vars
  xmlFileToJs(istxml, false, function (err, obj) {
    if (err) throw (err)
    if (!window.confirm('Διαγραφή του ' + obj.istiodromies.istiodromia[index].onoma + ';')) {
      return
    }

    var istkat = obj.istiodromies.istiodromia[index].istkat
    var id = obj.istiodromies.istiodromia[index].id

    if (obj.istiodromies.istiodromia.length > 1) {
      obj.istiodromies.istiodromia.splice(index, 1)
      xmlFileToJs(katxml, false, function (err, objkat) {
        if (err) throw (err)
        objkat.katigories.katigoria.forEach(function (itemkat) {
          var istnum = _.filter(obj.istiodromies.istiodromia, function (item) {
            return item.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
          }).length
          if (istnum) {
            if (istnum > 10 && istnum < 21) { istnum = 10 }
            if (istnum > 20) { istnum = Math.round(istnum / 2) }
            if (istnum > 20) { istnum = 20 }

            obj.istiodromies['istnum' + itemkat.id[0]] = istnum
          } else {
            obj.istiodromies['istnum' + itemkat.id[0]] = null
          }
        })
        istrefresh(istxml, obj)
      })
    } else {
      obj = null
      istrefresh(istxml, obj)
    }

    // διαγραφή της ιστιοδρομίας στα σκαφη
    xmlFileToJs(yachtxml, false, function (err, objyacht) {
      if (err) throw (err)
      if (objyacht) {
        objyacht.yachts.yacht.forEach(function (itemyacht) {
          if (itemyacht.istiodromies) {
            if (itemyacht.yachtkat[0] == istkat) { // eslint-disable-line eqeqeq
              var idxistyacht = itemyacht.istiodromies.findIndex(x => x.istid[0] == id) // eslint-disable-line eqeqeq
              if (idxistyacht > -1) {
                itemyacht.istiodromies.splice(idxistyacht, 1)
              }
            }
          }
        })
        jsToXmlFile(yachtxml, objyacht, function (err) {
          if (err) throw (err)
        })
      }
    })
  })
}

// Καθάρισμα των inputbox
exports.istclear = function istclear () {
  window.jQuery('#istiodromia').val('')
  window.jQuery('#ist').val('')
  window.jQuery('#istid').val('')
  window.jQuery('#nm').val('')
  window.jQuery('#baritita').val('')
  window.jQuery('#istkatid').val('')
}

// αποθηκεύει την Επεξεργασία
// ή Νέα εγγραφή αν δεν υπάρχει ίδια Συντομογραφία Κατηγορίας
exports.istsave = function istsave () { // eslint-disable-line no-unused-vars
  var istiodromia = window.jQuery('#istiodromia').val().trim()
  var ist = window.jQuery('#ist').val().trim().toUpperCase()
  var istid = window.jQuery('#istid').val().trim()
  var nm = window.jQuery('#nm').val().trim().replace(/,/g, '_')
  var baritita = window.jQuery('#baritita').val().trim().replace(/,/g, '_')
  var istkat = window.jQuery('#istkatid').val().trim()
  var datetime = Date.now()

  if (!istiodromia || !ist || !istkat) {
    window.alert('Τα πεδία "Ιστιοδρομία", "Κωδικός" και "Κατηγορία" δεν πρέπει να είναι κενά.')
    return
  }
  xmlFileToJs(istxml, false, function (err, obj) {
    if (err) throw (err)
    if (!obj) {
      obj = {
        'istiodromies': {
          'istiodromia':
                {'onoma': istiodromia, 'id': ist + istkat, 'ist': ist, 'nm': nm, 'baritita': baritita, 'istkat': istkat, 'datetime': datetime}
        }
      }
      obj.istiodromies['istnum' + istkat] = 1
      // εισαγωγή της ιστιοδρομίας στα σκαφη
      xmlFileToJs(yachtxml, false, function (err, objyacht) {
        if (err) throw (err)
        if (objyacht) {
          objyacht.yachts.yacht.forEach(function (itemyacht) {
            if (itemyacht.yachtkat[0] == istkat) { // eslint-disable-line eqeqeq
              if (itemyacht.istiodromies) {
                itemyacht.istiodromies.push({'istid': ist + istkat, 'istiodromia': ist, 'position': null, 'datetime': datetime})
              } else {
                itemyacht.istiodromies = [{'istid': ist + istkat, 'istiodromia': ist, 'position': null, 'datetime': datetime}]
              }
            }
          })
          jsToXmlFile(yachtxml, objyacht, function (err) {
            if (err) throw (err)
          })
        }
      })
      istrefresh(istxml, obj)
    } else {
      if (istid) {
        let saveok = true
        obj.istiodromies.istiodromia.forEach(function (item) {
          if (item.id == ist + istkat && istid != obj.istiodromies.istiodromia.findIndex(x => x.id === item.id)) { // eslint-disable-line eqeqeq
            window.alert('Υπάρχει ήδη καταχωρισμένη Ιστιοδρομία με κωδικό ' + ist + ' στην Κατηγορία ' + istkat + '.')
            saveok = false
          }
        })
        if (saveok) {
          var oldistkat = obj.istiodromies.istiodromia[istid].istkat
          var oldid = obj.istiodromies.istiodromia[istid].id

          obj.istiodromies.istiodromia[istid].onoma = istiodromia
          obj.istiodromies.istiodromia[istid].id = ist + istkat
          obj.istiodromies.istiodromia[istid].ist = ist
          obj.istiodromies.istiodromia[istid].nm = nm
          obj.istiodromies.istiodromia[istid].baritita = baritita
          obj.istiodromies.istiodromia[istid].istkat = istkat

        // ενημέρωση της ιστιοδρομίας στα σκαφη
          xmlFileToJs(yachtxml, false, function (err, objyacht) {
            if (err) throw (err)
            if (objyacht) {
              objyacht.yachts.yacht.forEach(function (itemyacht) {
                if (itemyacht.yachtkat[0] == oldistkat) { // eslint-disable-line eqeqeq
                  var idxistyacht = itemyacht.istiodromies.findIndex(x => x.istid[0] == oldid) // eslint-disable-line eqeqeq
                  if (idxistyacht > -1) {
                    itemyacht.istiodromies[idxistyacht].istid = ist + istkat
                    itemyacht.istiodromies[idxistyacht].istiodromia = ist
                  }
                }
              })
              jsToXmlFile(yachtxml, objyacht, function (err) {
                if (err) throw (err)
              })
            }
          })
        }
      } else {
        let saveok = true
        if (obj.istiodromies.istiodromia) {
          obj.istiodromies.istiodromia.forEach(function (item) {
            if (item.id == ist + istkat) { // eslint-disable-line eqeqeq
              window.alert('Υπάρχει ήδη καταχωρισμένη Ιστιοδρομία με κωδικό ' + ist + ' στην Κατηγορία ' + istkat + '.')
              saveok = false
            }
          })
        }
        if (saveok) {
          if (obj.istiodromies.istiodromia) {
            obj.istiodromies.istiodromia.push({'onoma': istiodromia, 'id': ist + istkat, 'ist': ist, 'nm': nm, 'baritita': baritita, 'istkat': istkat, 'datetime': datetime})
          } else {
            obj.istiodromies.istiodromia = [{'onoma': istiodromia, 'id': ist + istkat, 'ist': ist, 'nm': nm, 'baritita': baritita, 'istkat': istkat, 'datetime': datetime}]
          }

          // εισαγωγή της ιστιοδρομίας στα σκαφη
          xmlFileToJs(yachtxml, false, function (err, objyacht) {
            if (err) throw (err)
            if (objyacht) {
              objyacht.yachts.yacht.forEach(function (itemyacht) {
                if (itemyacht.yachtkat[0] == istkat) { // eslint-disable-line eqeqeq
                  if (itemyacht.istiodromies) {
                    itemyacht.istiodromies.push({'istid': ist + istkat, 'istiodromia': ist, 'position': null, 'datetime': datetime})
                  } else {
                    itemyacht.istiodromies = [{'istid': ist + istkat, 'istiodromia': ist, 'position': null, 'datetime': datetime}]
                  }
                  itemyacht.istiodromies.sort(
                    firstBy('datetime')
                  )
                }
              })

              jsToXmlFile(yachtxml, objyacht, function (err) {
                if (err) throw (err)
              })
            }
          })
        }
      }
    }

    if (obj.istiodromies.istiodromia.length && parseInt(obj.istiodromies.istiodromia.length)) {
      xmlFileToJs(katxml, false, function (err, objkat) {
        if (err) throw (err)
        objkat.katigories.katigoria.forEach(function (itemkat) {
          var istnum = _.filter(obj.istiodromies.istiodromia, function (item) {
            return item.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
          }).length
          if (istnum) {
            if (istnum > 10 && istnum < 21) { istnum = 10 }
            if (istnum > 20) { istnum = Math.round(istnum / 2) }
            if (istnum > 20) { istnum = 20 }

            obj.istiodromies['istnum' + itemkat.id[0]] = istnum
          }
        })
        istrefresh(istxml, obj)
      })
    }
  })
}

exports.istnumsave = function istnumsave (controlid) { // eslint-disable-line no-unused-vars
  var msg = 'Ο Αριθμός των Ιστιοδρομιών που προσμετρώνται ' +
  'ενημερώνεται αυτόματα σε κάθε εισαγωγή ή διαγραφή ιστιοδρομίας ' +
  'και ορίζεται ως εξής:\n\n' +
  'κάτω από 10 => όλες\n' +
  '10 έως 20 => οι 10\n' +
  '20 και πάνω => οι μισές (50%) ' +
  'όχι όμως πάνω από 20\n\n' +
  'Θέλετε να συνεχίσετε την καταχώριση;\n'
  if (window.confirm(msg) === false) {
    window.patreas.getistList()
    return
  }
  var istnum = window.jQuery('#' + controlid).val().trim()
  if (istnum && isNaN(istnum)) {
    window.alert('Πληκτρολογείστε μόνο αριθμούς')
    return
  }
  xmlFileToJs(istxml, false, function (err, obj) {
    if (err) throw (err)

    obj.istiodromies[controlid] = parseInt(istnum)

    jsToXmlFile(istxml, obj, function (err) {
      if (err) throw (err)
    })
  })
}

exports.nm_eleghomenessave = function nm_eleghomenessave () {
  xmlFileToJs(istxml, false, function (err, obj) {
    if (err) throw (err)
    if (window.jQuery('#nm_eleghomenes').val().trim()) {
      obj.istiodromies.nm_eleghomenes = window.jQuery('#nm_eleghomenes').val().trim()
    } else {
      delete obj.istiodromies.nm_eleghomenes
    }
    jsToXmlFile(istxml, obj, function (err) {
      if (err) throw (err)
    })
  })
}

// ------ ΣΚΑΦΗ --------

// δημιουργία από το xml των εγγραφών για τις κατηγορίες
function yachtlistdata (obj, callback) {
  var yachtHtml = ''
  var idx
  var chkyachtkat
  var colorclass
  counter = 1
  xmlFileToJs(katxml, false, function (err, objkat) {
    if (err) throw (err)
    obj.yachts.yacht.forEach(function (item) {
      if (!_.isEqual(chkyachtkat, item.yachtkat)) {
        counter = 1
        var idxkat = objkat.katigories.katigoria.findIndex(x => x.id == item.yachtkat[0]) // eslint-disable-line eqeqeq
        yachtHtml = yachtHtml + '\n<div class="row"><div class="form-control-static bg-primary text-center h3">' + objkat.katigories.katigoria[idxkat].onoma + '</div></div>\n'
      }
      idx = obj.yachts.yacht.findIndex(x => x.id === item.id)
      if (counter % 2) { colorclass = '' } else { colorclass = 'bg-grey' }
      yachtHtml = yachtHtml + '\n<div class="row ' + colorclass + '">\n' +
    '<div class="form-control-static col-md-1 col-sm-1 col-xs-1 text-right">' + counter + '</div>\n' +
    '<div class="form-control-static col-md-2 col-sm-2 col-xs-2">' + item.id + '</div>\n' +
      '<div class="form-control-static col-md-4 col-sm-4 col-xs-4 ">' + item.onoma + '</div>\n' +
      '<div class="form-control-static col-md-2 col-sm-2 col-xs-2 ">' + item.yachtkat + '</div>\n' +
      '<div class="col-md-2 col-sm-2 col-xs-2 text-center">\n' +
      ' <a href="javascript:window.patreas.yachtedit(' + idx + ');" class="form-control-static" role="button" title="Επεξεργασία ' + item.onoma + '" > <img src="images/edit.ico" height="20" /></a>\n' +
      ' <a href="javascript:window.patreas.yachtdelete(' + idx + ');" class="form-control-static" role="button" title="Διαγραφή ' + item.onoma + '" > <img src="images/delete.ico" height="20" /></a>\n' +
      '</div>\n' +
      '</div>\n'
      counter = counter + 1
      chkyachtkat = item.yachtkat
    })
    callback(yachtHtml)
  })
}

// δημιουργία από το xml των εγγραφών για τις κατηγορίες
function katselectdata (obj, id, callback) {
  var katselect = '<select id="' + id + '" class="form-control">\n' +
  '<option value=""></option>\n'
  obj.katigories.katigoria.forEach(function (item) {
    katselect = katselect + '<option value="' + item.id + '">' + item.id + '</option>\n'
  })
  katselect = katselect + '</select>'
  callback(katselect)
}

// τοποθετεί στην div με id="ist-list" τα δεδομένα
// που παίρνει από τη istlistdata
exports.getyachtList = function getyachtList () {
  xmlFileToJs(yachtxml, false, function (err, obj) {
    if (err) throw (err)
    if (obj) {
      yachtlistdata(obj, function (yachtHtml) {
        window.jQuery('#yacht-list').html(yachtHtml)
      })
    } else {
      window.jQuery('#yacht-list').html('')
    }
  })
  xmlFileToJs(katxml, false, function (err, obj) {
    if (err) throw (err)
    if (obj) {
      katselectdata(obj, 'yachtkatid', function (katselect) {
        window.jQuery('#yachtkatdiv').html(katselect)
      })
    }
  })
}

// γεμίζει τα inputbox με τις τιμές για Επεξεργασία
exports.yachtedit = function yachtedit (idx) { // eslint-disable-line no-unused-vars
  xmlFileToJs(yachtxml, false, function (err, obj) {
    if (err) throw (err)
    if (obj) {
      window.jQuery('#yacht').val(obj.yachts.yacht[idx].onoma)
      window.jQuery('#sailnum').val(obj.yachts.yacht[idx].id)
      window.jQuery('#yachtid').val(idx)
      window.jQuery('#yachtkatid').val(obj.yachts.yacht[idx].yachtkat)
    }
  })
}

// Ανανεώνει τη λίστα των κατηγοριών
// μετά από καταχώρηση, επεξεργασία, διαγραφή
function yachtrefresh (file, obj) {
  if (!obj) {
    var filename = path.normalize(path.join(userDataPath, yachtxml))
    fs.writeFile(filename, '', function (err) {
      if (err) console.log(err)
      console.log('The file ' + filename + ' was saved!')
    })
  } else {
    // ταξινομηση με βάση πεδία
    if (obj.yachts.yacht.length) {
      obj.yachts.yacht.sort(
      firstBy('yachtkat')
      .thenBy('onoma')
      )
    }
    jsToXmlFile(file, obj, function (err) {
      if (err) throw (err)
    })
  }
  window.patreas.getyachtList()
  window.patreas.yachtclear()
}

// Διαγραφή Κατηγορίας
exports.yachtdelete = function yachtdelete (index) { // eslint-disable-line no-unused-vars
  xmlFileToJs(yachtxml, false, function (err, obj) {
    if (err) throw (err)
    if (!window.confirm('Διαγραφή του ' + obj.yachts.yacht[index].onoma + ';')) {
      return
    }
    if (obj.yachts.yacht.length > 1) {
      obj.yachts.yacht.splice(index, 1)
    } else {
      obj = null
    }
    yachtrefresh(yachtxml, obj)
  })
}

// Καθάρισμα των inputbox
exports.yachtclear = function yachtclear () {
  window.jQuery('#yacht').val('')
  window.jQuery('#sailnum').val('')
  window.jQuery('#yachtid').val('')
  window.jQuery('#yachtkatid').val('')
}

// αποθηκεύει την Επεξεργασία
// ή Νέα εγγραφή αν δεν υπάρχει ίδια Συντομογραφία Κατηγορίας
exports.yachtsave = function yachtsave () { // eslint-disable-line no-unused-vars
  var yacht = window.jQuery('#yacht').val().trim()
  var sailnum = window.jQuery('#sailnum').val().trim().toUpperCase()
  var yachtid = window.jQuery('#yachtid').val().trim()
  var yachtkatid = window.jQuery('#yachtkatid').val().trim()

  if (!yacht || !sailnum || !yachtkatid) {
    window.alert('Τα πεδία "Αρ.Πανιών", "Σκάφος"  και  "Κατηγορία" δεν πρέπει να είναι κενά.')
    return
  }
  var racedata = []
  xmlFileToJs(istxml, false, function (err, objist) {
    if (err) throw (err)
    if (objist) {
      objist.istiodromies.istiodromia.forEach(function (itemist) {
        if (itemist.istkat[0] == yachtkatid) { // eslint-disable-line eqeqeq
          racedata.push({'istid': itemist.id, 'istiodromia': itemist.ist, 'position': null})
        }
      })
    }
    xmlFileToJs(yachtxml, false, function (err, obj) {
      if (err) throw (err)
      if (!obj) {
        obj = {
          'yachts': {
            'yacht': {
              'id': sailnum, 'onoma': yacht, 'yachtkat': yachtkatid, 'istiodromies': racedata
            }
          }
        }
      } else {
        if (yachtid) {
          let saveok = true
          obj.yachts.yacht.forEach(function (item) {
            if (item.id == sailnum && yachtid != obj.yachts.yacht.findIndex(x => x.id === item.id)) { // eslint-disable-line eqeqeq
              window.alert('Υπάρχει ήδη καταχωρισμένο Σκάφος με Αρ.Πανιών ' + sailnum + '.')
              saveok = false
            }
          })
          if (saveok) {
            obj.yachts.yacht[yachtid].onoma = yacht
            obj.yachts.yacht[yachtid].id = sailnum
            obj.yachts.yacht[yachtid].yachtkat = yachtkatid
            obj.yachts.yacht[yachtid].istiodromies = racedata
          }
        } else {
          let saveok = true
          obj.yachts.yacht.forEach(function (item) {
            if (item.id == sailnum) { // eslint-disable-line eqeqeq
              window.alert('Υπάρχει ήδη καταχωρισμένο Σκάφος με Αρ.Πανιών ' + sailnum + '.')
              saveok = false
            }
          })
          if (saveok) {
            obj.yachts.yacht.push({'id': sailnum, 'onoma': yacht, 'yachtkat': yachtkatid, 'istiodromies': racedata})
          }
        }
      }
      yachtrefresh(yachtxml, obj)
    })
  })
}

// ----- ΕΙΣΑΓΩΓΗ ΔΕΔΟΜΕΝΩΝ ------------

// δημιουργία από το xml των εγγραφών για τις κατηγορίες
function datalistdata (callback) {
  var colorclass = ''
  var dataHtml = ''
  var idxyacht
  var idxist
  xmlFileToJs(katxml, false, function (err, objkat) {
    if (err) throw (err)
    xmlFileToJs(istxml, false, function (err, objist) {
      if (err) throw (err)
      xmlFileToJs(yachtxml, false, function (err, objyacht) {
        if (err) throw (err)
        objkat.katigories.katigoria.forEach(function (itemkat) {
          dataHtml = dataHtml + '<table class="table table-condensed table-responsive">\n'
          var colspan = _.filter(objist.istiodromies.istiodromia, function (myitem) {
            return myitem.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
          }).length + 2
          dataHtml = dataHtml + '<tr>\n<td colspan="' + colspan + '" class="text-center bg-primary h3">' + itemkat.onoma + '</td></tr>\n'
          dataHtml = dataHtml + '<tr><td colspan=2 rowspan=2 >&nbsp;</td>'
          counter = 1
          _.filter(objist.istiodromies.istiodromia, function (myitem) {
            return myitem.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
          }).forEach(function (item) {
            dataHtml = dataHtml + '<td class="text-center" >' + counter + '</td>'
            counter = counter + 1
          })
          dataHtml = dataHtml + '</tr>'
          dataHtml = dataHtml + '<tr>'
          _.filter(objist.istiodromies.istiodromia, function (myitem) {
            return myitem.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
          }).forEach(function (item) {
            dataHtml = dataHtml + '<th class="text-center" title="' + item.onoma + '">' + item.ist + '</th>'
          })
          dataHtml = dataHtml + '</tr>'
          counter = 1
          objyacht.yachts.yacht.forEach(function (item) {
            if (_.isEqual(itemkat.id, item.yachtkat)) {
              idxyacht = objyacht.yachts.yacht.findIndex(x => x.id === item.id)
              if (counter % 2) { colorclass = '' } else { colorclass = 'bg-grey' }
              dataHtml = dataHtml + '<tr class="' + colorclass + '">\n' +
              '<td class="text-center vert-align">' + counter + '</td><td class="vert-align" title="' + item.id + ' ' + item.onoma + '">' + item.onoma + '</td>\n'
              counter = counter + 1
              _.filter(objist.istiodromies.istiodromia, function (myitem) {
                return myitem.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
              }).forEach(function (itm) {
                idxist = _.filter(objist.istiodromies.istiodromia, function (myitem) {
                  return myitem.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
                }).findIndex(x => x.id === itm.id)
                var idxistyacht = objyacht.yachts.yacht[idxyacht].istiodromies.findIndex(x => x.istid[0] == itm.id) // eslint-disable-line eqeqeq
                if (idxistyacht === -1) {
                  dataHtml = dataHtml + '<td>\n<input type="text" id="' + idxyacht + '-' + idxist + '" class="form-control form-fixer text-center transparent-input" value=""></td\n>'
                } else {
                  dataHtml = dataHtml + '<td>\n<input type="text" id="' + idxyacht + '-' + idxist + '" class="form-control form-fixer text-center transparent-input" value="' + objyacht.yachts.yacht[idxyacht].istiodromies[idxistyacht].position + '"></td\n>'
                }
              })

              dataHtml = dataHtml + '</tr>\n'
            }
          })
          dataHtml = dataHtml + '<tr>\n<td colspan="' + colspan + '" class="text-center h3">' +
          '<a href="javascript:window.patreas.datasave();" class="form-control-static" role="button" title="Αποθήκευση" > <img src="images/save.ico" height="30" /></a>\n' +
          '<a href="javascript:window.patreas.getdataList();" class="form-control-static" role="button" title="Καθάρισμα" > <img src="images/clear.ico" height="30" /></a>\n' +
          '</td></tr>\n'
          dataHtml = dataHtml + '</table>\n'
        })
        callback(dataHtml)
      })
    })
  })
}

// τοποθετεί στην div με id="ist-list" τα δεδομένα
// που παίρνει από τη istlistdata
exports.getdataList = function getdataList () {
  datalistdata(function (dataHtml) {
    window.jQuery('#data-list').html(dataHtml)
  })
}

// δημιουργία από το xml των εγγραφών για τις κατηγορίες
exports.datasave = function datasave () { // eslint-disable-line no-unused-vars
  var inputid
  xmlFileToJs(katxml, false, function (err, objkat) {
    if (err) throw (err)
    xmlFileToJs(istxml, false, function (err, objist) {
      if (err) throw (err)
      xmlFileToJs(yachtxml, false, function (err, objyacht) {
        if (err) throw (err)
        objkat.katigories.katigoria.forEach(function (itemkat) {
          objyacht.yachts.yacht.forEach(function (item) {
            if (_.isEqual(itemkat.id, item.yachtkat)) {
              var idxyacht = objyacht.yachts.yacht.findIndex(x => x.id === item.id)
              _.filter(objist.istiodromies.istiodromia, function (myitem) {
                return myitem.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
              }).forEach(function (itm) {
                var idxist = _.filter(objist.istiodromies.istiodromia, function (myitem) {
                  return myitem.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
                }).findIndex(x => x.id === itm.id)
                var idxistyacht = objyacht.yachts.yacht[idxyacht].istiodromies.findIndex(x => x.istid[0] == itm.id) // eslint-disable-line eqeqeq
                inputid = '#' + idxyacht + '-' + idxist
                var inputvalue = window.jQuery(inputid).val().trim()
                if (inputvalue) {
                  if (!parseInt(inputvalue)) {
                    if ('#DNS#DNC#DSQ#OCS#BFD#DNE#DGM#DNF#RET'.indexOf(inputvalue.toUpperCase()) === -1) {
                      window.alert('Μη έγκυρη τιμή ' + inputvalue + '\nγια το σκάφος ' + objyacht.yachts.yacht[idxyacht].onoma + '\nστην ιστιοδρομία ' + objist.istiodromies.istiodromia[idxist].onoma)
                      return
                    }
                  }

                  if (idxistyacht === -1) {
                    objyacht.yachts.yacht[idxyacht].istiodromies.push({'istid': itm.id, 'istiodromia': itm.ist, 'position': inputvalue.toUpperCase(), 'datetime': itm.datetime})
                  } else {
                    objyacht.yachts.yacht[idxyacht].istiodromies[idxistyacht].position = inputvalue.toUpperCase()
                  }
                } else {
                  if (idxistyacht > -1) {
                    objyacht.yachts.yacht[idxyacht].istiodromies.splice(idxistyacht, 1)
                  }
                }
              })
              item.istiodromies.sort(
                firstBy('datetime')
              )
            }
          })
        })
        jsToXmlFile(yachtxml, objyacht, function (err) {
          if (err) throw (err)
        })
        window.patreas.getdataList()
      })
    })
  })
}

// ----------- ΑΠΟΤΕΛΕΣΜΑΤΑ ---------------------------------

// δημιουργία από το xml των εγγραφών για τις κατηγορίες
function resultslistdata (callback) {
  var colorclass = ''
  var resultsHtml = ''
  var idxyacht
  var idxist
  xmlFileToJs(katxml, false, function (err, objkat) {
    if (err) throw (err)
    xmlFileToJs(istxml, false, function (err, objist) {
      if (err) throw (err)
      xmlFileToJs(yachtxml, false, function (err, objyacht) {
        if (err) throw (err)

        // ypologismoi
        var yachtnuminist = []
        var minscoreinist = []

        // βρίσκω πόσα σκάφη εκκίνησαν κατά κατηγορία σε κάθε ιστιοδρομία
        var istidx = 0
        objist.istiodromies.istiodromia.forEach(function () {
          yachtnuminist[istidx] = 0
          istidx = istidx + 1
        })

        objyacht.yachts.yacht.forEach(function (itemyacht) {
          itemyacht.istiodromies.forEach(function (itemyachtist) {
            idxist = objist.istiodromies.istiodromia.findIndex(x => x.id == itemyachtist.istid[0]) // eslint-disable-line eqeqeq
            if (parseInt(itemyachtist.position)) {
              yachtnuminist[idxist] = yachtnuminist[idxist] + 1
            } else {
              if (itemyachtist.position) {
                if ('#DNS#DNC#OCS'.indexOf(itemyachtist.position) === -1) {
                  yachtnuminist[idxist] = yachtnuminist[idxist] + 1
                }
              }
            }
          })
        })

        var countDNE4yacht = []

        // πρωτος υπολογισμός για τα αριθμητικά δεδομένα
        idxyacht = 0
        objyacht.yachts.yacht.forEach(function (itemyacht) {
          countDNE4yacht[idxyacht] = 0
          itemyacht.istiodromies.forEach(function (itemistiodromia) {
            idxist = objist.istiodromies.istiodromia.findIndex(x => x.id == itemistiodromia.istid[0]) // eslint-disable-line eqeqeq
            if (parseFloat(itemistiodromia.position)) {
              var ekinisan = yachtnuminist[idxist]
              var nm = Math.round(objist.istiodromies.istiodromia[idxist].nm)
              if (objist.istiodromies.istiodromia[idxist].eleghomenosStivos) {
                if (objist.istiodromies.nm_eleghomenes) {
                  nm = objist.istiodromies.nm_eleghomenes
                }
              }
              var position = itemistiodromia.position
              var baritita = objist.istiodromies.istiodromia[idxist].baritita
              var score = Math.round(Math.sqrt(ekinisan * nm / (parseFloat(position) + 2)) * 100 * baritita)
              //alert(itemyacht.onoma + " " + position + " " + Math.round(Math.sqrt(ekinisan * nm / (parseInt(position) + 2)) * 100 * baritita) + " - " + score)
              itemistiodromia.score = score
            }
            if (itemistiodromia.position == 'DNE') { // eslint-disable-line eqeqeq
              itemistiodromia.score = '0'
              countDNE4yacht[idxyacht] = countDNE4yacht[idxyacht] + 1
            }
          })
          idxyacht = idxyacht + 1
        })

        idxist = 0
        objist.istiodromies.istiodromia.forEach(function (itemist) {
          minscoreinist[idxist] = 1000000000000
          objyacht.yachts.yacht.forEach(function (itemyacht) {
            var idxistyacht = itemyacht.istiodromies.findIndex(x => x.istid[0] == itemist.id) // eslint-disable-line eqeqeq
            if (idxistyacht > -1) {
              if (parseInt(itemyacht.istiodromies[idxistyacht].score) > 0 && minscoreinist[idxist] > parseInt(itemyacht.istiodromies[idxistyacht].score)) {
                minscoreinist[idxist] = parseInt(itemyacht.istiodromies[idxistyacht].score)
              }
            }
          })
          idxist = idxist + 1
        })

      // αντικατάσταση DNF και RET με 10% του μικρότερου score
        objyacht.yachts.yacht.forEach(function (itemyacht) {
          itemyacht.istiodromies.forEach(function (itemistiodromia) {
            idxist = objist.istiodromies.istiodromia.findIndex(x => x.id == itemistiodromia.istid[0]) // eslint-disable-line eqeqeq
            if (itemistiodromia.position == 'DNF' || itemistiodromia.position == 'RET') { // eslint-disable-line eqeqeq
              var tenpercent = Math.round(parseInt(minscoreinist[idxist]) * 10 / 100)
              itemistiodromia.score = tenpercent
            }
          })
        })

        // ενημερωση συνολων
        var istnum
        var minscore4yacht = []

        objyacht.yachts.yacht.forEach(function (itemyacht) {
          istnum = parseInt(objist.istiodromies['istnum' + itemyacht.yachtkat[0]])
          idxyacht = objyacht.yachts.yacht.findIndex(x => x.id === itemyacht.id)
          var scoresum = 0
          var scorecount = 0
          var yachtscores = []
          itemyacht.istiodromies.forEach(function (itemistiodromia) {
            if (itemistiodromia.score) {
              yachtscores.push(parseInt(itemistiodromia.score))
              scoresum = scoresum + parseInt(itemistiodromia.score)
              scorecount = scorecount + 1
            }
          })

          var finalistnum = istnum
          if (countDNE4yacht[idxyacht]) {
            finalistnum = istnum - countDNE4yacht[idxyacht]
          }
          if (scorecount < finalistnum) {
            itemyacht.scoresum = scoresum
          } else {
            minscore4yacht[idxyacht] = yachtscores.sort(function (a, b) { return b - a })[finalistnum - 1]
            scoresum = 0
            scorecount = 0
            yachtscores.forEach(function (value) {
              if (scorecount < finalistnum) {
                scoresum = scoresum + value
                scorecount = scorecount + 1
              }
              itemyacht.scoresum = scoresum
            })
          }
        })

        var keepequal4yacht = []

        objyacht.yachts.yacht.forEach(function (itemyacht) {
          istnum = parseInt(objist.istiodromies['istnum' + itemyacht.yachtkat[0]])
          idxyacht = objyacht.yachts.yacht.findIndex(x => x.id === itemyacht.id)
          var countmax = 0
          var countequal = 0
          itemyacht.istiodromies.forEach(function (itemistiodromia) {
            if (minscore4yacht[idxyacht]) {
              if (itemistiodromia.score > minscore4yacht[idxyacht]) { countmax = countmax + 1 }
              if (itemistiodromia.score == minscore4yacht[idxyacht]) { countequal = countequal + 1 } // eslint-disable-line eqeqeq
              if (itemistiodromia.score != '0' && itemistiodromia.score < minscore4yacht[idxyacht]) { // eslint-disable-line eqeqeq
                itemistiodromia.status = 'drop'
              }
            }
          })
          if (countmax + countequal > istnum) {
            keepequal4yacht[idxyacht] = istnum - countmax
          }
        })

        objyacht.yachts.yacht.forEach(function (itemyacht) {
          idxyacht = objyacht.yachts.yacht.findIndex(x => x.id === itemyacht.id)
          if (keepequal4yacht[idxyacht]) {
            var countchk = 1
            itemyacht.istiodromies.forEach(function (itemistiodromia) {
              if (itemistiodromia.score == minscore4yacht[idxyacht]) { // eslint-disable-line eqeqeq
                if (countchk > keepequal4yacht[idxyacht]) {
                  itemistiodromia.status = 'drop'
                }
                countchk = countchk + 1
              }
            })
          }
        })

        // ταξινόμηση
        objyacht.yachts.yacht.sort(
            firstBy('yachtkat')
            .thenBy('scoresum', -1)
            .thenBy('onoma')
          )

      // τακτοποίηση παρουσίασης

        objkat.katigories.katigoria.forEach(function (itemkat) {
          resultsHtml = resultsHtml + '<div class="row"><div class="col-md-12 col-sm-12 col-xs-12 form-control-static text-center bg-primary h2">' + itemkat.onoma + '</div>\n</div>\n'
          resultsHtml = resultsHtml + '<div class="row"><div class="col-md-12 col-sm-12 col-xs-12 form-control-static text-center h4">' + 'Προσμετρώνται ' + objist.istiodromies['istnum' + itemkat.id] + ' ιστιοδρομίες</div>\n</div>\n'
          resultsHtml = resultsHtml + '<div class="row"><div class="table-responsive ">\n'
          resultsHtml = resultsHtml + '<table id="resultstable" class="table table-condensed table-bordered table-responsive">\n'
          resultsHtml = resultsHtml + '<tr><th class="vert-align text-right" rowspan=2 colspan=3 >Ιστιοδρομίες</th>'
          counter = 1
          _.filter(objist.istiodromies.istiodromia, function (myitem) {
            return myitem.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
          }).forEach(function (item) {
            idxist = objist.istiodromies.istiodromia.findIndex(x => x.id === item.id)
            if (yachtnuminist[idxist]) {
              resultsHtml = resultsHtml + '<td class="text-center">' + counter + '</td>'
              counter = counter + 1
            }
          })
          resultsHtml = resultsHtml + '<td rowspan=2 class="text-center" ></td>'
          resultsHtml = resultsHtml + '</tr>'
          resultsHtml = resultsHtml + '<tr>'
          _.filter(objist.istiodromies.istiodromia, function (myitem) {
            return myitem.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
          }).forEach(function (item) {
            idxist = objist.istiodromies.istiodromia.findIndex(x => x.id === item.id)
            if (yachtnuminist[idxist]) {
              resultsHtml = resultsHtml + '<th class="text-center" title=\'' + item.onoma + '\'>' + item.ist + '</th>'
            }
          })
          resultsHtml = resultsHtml + '</tr>'
          resultsHtml = resultsHtml + '<tr class="bg-warning"><td class="text-right" colspan=2 >Αρ. Σκαφών</td><td class="text-center" title="S = Πλήθος κανονικώς εκκινησάντων σκαφών"><b>S</b></td>'
          _.filter(objist.istiodromies.istiodromia, function (myitem) {
            return myitem.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
          }).forEach(function (item) {
            idxist = objist.istiodromies.istiodromia.findIndex(x => x.id === item.id)
            if (yachtnuminist[idxist]) {
              var shownuminist = yachtnuminist[idxist] > 0 ? yachtnuminist[idxist] : '&nbsp;'
              resultsHtml = resultsHtml + '<th class="text-center" title="Πλήθος κανονικώς εκκινησάντων σκαφών στο ' + item.onoma + '">' + shownuminist + '</th>'
            }
          })
          resultsHtml = resultsHtml + '<th class="text-center vert-align" rowspan=3 >ΣΥΝΟΛΟ<br>ΒΑΘΜΩΝ</th></tr>'
          resultsHtml = resultsHtml + '<tr class="bg-warning"><td class="text-right" colspan=2 >Απόσταση</td><td class="text-center" title="Μ = Συντελεστής απόστασης σε Nm"><b>Μ</b></td>'
          _.filter(objist.istiodromies.istiodromia, function (myitem) {
            return myitem.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
          }).forEach(function (item) {
            idxist = objist.istiodromies.istiodromia.findIndex(x => x.id === item.id)
            if (yachtnuminist[idxist]) {
              var shownm = Math.round(item.nm) ? Math.round(item.nm) : '&nbsp;'
              if (item.eleghomenosStivos) {
                if (objist.istiodromies.nm_eleghomenes) {
                  shownm = objist.istiodromies.nm_eleghomenes
                }
              }
              resultsHtml = resultsHtml + '<th class="text-center" >' + shownm + '</th>'
            }
          })
          resultsHtml = resultsHtml + '</tr>'
          resultsHtml = resultsHtml + '<tr class="bg-warning"><td class="text-right" colspan=2 >Βαρύτητα</td><td class="text-center" title="B = Συντελεστής βαρύτητας"><b>B</b></td>'
          _.filter(objist.istiodromies.istiodromia, function (myitem) {
            return myitem.istkat == itemkat.id[0] // eslint-disable-line eqeqeq
          }).forEach(function (item) {
            idxist = objist.istiodromies.istiodromia.findIndex(x => x.id === item.id)
            if (yachtnuminist[idxist]) {
              resultsHtml = resultsHtml + '<th class="text-center" >' + item.baritita + '</th>'
            }
          })
          resultsHtml = resultsHtml + '</tr>'
          counter = 1
          objyacht.yachts.yacht.forEach(function (item) {
            if (_.isEqual(itemkat.id, item.yachtkat)) {
              idxyacht = objyacht.yachts.yacht.findIndex(x => x.id === item.id)
              if (counter % 2) { colorclass = '' } else { colorclass = 'bg-grey' }
              resultsHtml = resultsHtml + '<tr class="' + colorclass + ' ">\n<td  class="form-control-static vert-align text-center" rowspan=2>' + counter + '</td>\n' +
              '<td  class="form-control-static vert-align" rowspan=2  title="' + item.id + ' ' + item.onoma + '">' + item.onoma + '</td>\n' +
              '<td  class="form-control-static text-center" title="R = Θέση τερματισμού του σκάφους"><b>R</b></td>\n'
              counter = counter + 1
              objist.istiodromies.istiodromia.forEach(function (itm) {
                idxist = objist.istiodromies.istiodromia.findIndex(x => x.id[0] == itm.id) // eslint-disable-line eqeqeq
                var idxistyacht = item.istiodromies.findIndex(x => x.istid[0] == itm.id) // eslint-disable-line eqeqeq
                if (yachtnuminist[idxist]) {
                  if (idxistyacht > -1) {
                    resultsHtml = resultsHtml + '<td class="form-control-static text-center" >' + objyacht.yachts.yacht[idxyacht].istiodromies[idxistyacht].position + '</td\n>'
                  } else {
                    if (itm.istkat[0] == item.yachtkat) { // eslint-disable-line eqeqeq
                      resultsHtml = resultsHtml + '<td class="form-control-static text-center" >&nbsp;</td\n>'
                    }
                  }
                }
              })
              var showsum = objyacht.yachts.yacht[idxyacht].scoresum ? objyacht.yachts.yacht[idxyacht].scoresum : '&nbsp;'
              resultsHtml = resultsHtml + '<th  class="form-control-static vert-align text-center lead" rowspan=2  >' + showsum + '</th>'
              resultsHtml = resultsHtml + '</tr>\n'
              resultsHtml = resultsHtml + '<tr class="' + colorclass + '" >\n' +
              '<td  class="form-control-static text-center" title="score C = Βαθμοί ιστιοδρομίας"><b>C</b></td>\n'
              objist.istiodromies.istiodromia.forEach(function (itm) {
                idxist = objist.istiodromies.istiodromia.findIndex(x => x.id[0] == itm.id) // eslint-disable-line eqeqeq
                var idxistyacht = item.istiodromies.findIndex(x => x.istid[0] == itm.id) // eslint-disable-line eqeqeq
                if (yachtnuminist[idxist]) {
                  if (idxistyacht > -1) {
                    var showscore = objyacht.yachts.yacht[idxyacht].istiodromies[idxistyacht].score ? objyacht.yachts.yacht[idxyacht].istiodromies[idxistyacht].score : '&nbsp;'
                    var showstatus = objyacht.yachts.yacht[idxyacht].istiodromies[idxistyacht].status ? objyacht.yachts.yacht[idxyacht].istiodromies[idxistyacht].status : ''
                    resultsHtml = resultsHtml + '<td class="form-control-static text-center ' + showstatus + '" >' + showscore + '</td\n>'
                  } else {
                    if (itm.istkat[0] == item.yachtkat) { // eslint-disable-line eqeqeq
                      resultsHtml = resultsHtml + '<td class="form-control-static text-center" >&nbsp;</td\n>'
                    }
                  }
                }
              })
              resultsHtml = resultsHtml + '</tr>\n'
            }
          })
          resultsHtml = resultsHtml + '</table>\n</div>\n</div>\n'
        })
        callback(resultsHtml)
      })
    })
  })
}

// τοποθετεί στην div με id="ist-list" τα δεδομένα
// που παίρνει από τη istlistdata
exports.getResults = function getResults () { // eslint-disable-line no-unused-vars
  xmlFileToJs(yachtxml, false, function (err, obj) {
    if (err) throw (err)
    if (obj) {
      resultslistdata(function (resultsHtml) {
        window.jQuery('#results-list').html(resultsHtml)
        saveResults('results.html', resultsHtml)
      })
    } else {
      window.jQuery('#results-list').html('')
    }
  })
}

function saveResults (filename, data) {
  var header = '<!doctype html>\n' +
  '<html>\n' +
  '<head>\n' +
  '<meta charset="utf-8">\n' +
  '<title>Κύπελο Πατρέας</title>\n' +
  '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">\n' +
  '<style>\n' +
  '.table tbody>tr>td.vert-align\n' +
  '{\n' +
  'vertical-align: middle;\n' +
  '}\n' +
  '.table tbody>tr>th.vert-align\n' +
  '{\n' +
  'vertical-align: middle;\n' +
  '}\n' +
  '.drop{\n' +
  'color:red;\n' +
  'text-decoration:line-through;\n' +
  '}\n' +
  '.bg-grey{\n' +
  'background-color: #f5f5f5;\n' +
  '}\n' +
  '</style>\n' +
  '</head>\n' +
  '<body>\n' +
  '<div class="container-fluid">\n' +
  '<div class="row">\n' +
  '<div class="col-lg-12 col-md-12 col-sm-12 col-md-offset-0 col-sm-offset-0">\n' +
  '<div class="panel panel-default">\n' +
  '<div class="panel-heading h1 text-center">Κύπελο Πατρέας</div>\n' +
  '<div class="panel-body ">\n' +
  '<div class="row"><div class="form-conttrol-staticcol-lg-12 col-md-12 col-sm-12 h4 text-center ">s<b title="score C = Βαθμοί ιστιοδρομίας">C</b>ore = sqrt(<b title="S = Πλήθος κανονικώς εκκινησάντων σκαφών">S</b>*<b title="Μ = Συντελεστής απόστασης σε Nm">M</b>/(<b title="R = Θέση τερματισμού του σκάφους">R</b>+2)) * 100 * <b title="B = Συντελεστής βαρύτητας">B</b></div></div>\n'

  var thedate = new Date().toLocaleString()
  var created = '<a href="mailto:g.theodoroy@gmail.com?subject=Κύπελο Πατρέας" target="_top">GΘ@' + thedate + '</a>'
  var footer = '</div>\n' +
  '<div class="row">\n' +
  '<div class="form-control-static col-md-12 col-sm-12 col-xs-12 text-right strong">' + created + '</div>' +
  '</div>\n' +
  '</div>\n' +
  '</div>\n' +
  '</div>\n' +
  '</div>\n' +
  '</body>\n' +
  '<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>\n' +
  '</html>'

  var content = header + data + footer
  var filepath = path.normalize(path.join(userDataPath, filename))
  fs.writeFile(filepath, content, 'utf-8')
}

exports.printresults = function printresults (filename) { // eslint-disable-line no-unused-vars
  var filepath = path.normalize(path.join(userDataPath, filename))
  openurl.open(filepath)
}

exports.getOrcScFiles = function getOrcScFiles (dir) {
  var filesHTML = ''
  glob(dir + '/*.orcsc', null, function (er, files) {
    filesHTML = filesHTML + '<div class="col-md-6 col-sm-6 col-xs-6 col-md-offset-3 col-sm-offset-3 col-xs-offset-3 form-control-static h4">' +
    'Βρέθηκαν ' + files.length + ' αρχεία:' +
    '</div>' +
    '<div class="col-md-6 col-sm-6 col-xs-6 col-md-offset-4 col-sm-offset-4 col-xs-offset-4 form-control-static ">'
    files.forEach(function (orcscfile) {
      filesHTML = filesHTML + '<p>' + path.parse(orcscfile).base + '</p>'
    })
    var isWin = /^win/.test(process.platform)
    if (isWin) {
      dir = dir.replace(/\\/g, '\\\\')
    }
    filesHTML = filesHTML + '</div>' +
    '<div class="form-control-static col-md-12 col-sm-12 col-xs-12 h2 text-center">' +
      '<a href="javascript:window.patreas.insertOrcscFiles(\'' + dir + '\')" class="form-control-static" role="button" title="Ενημέρωση" > <img src="images/save.ico" height="30" /></a>' +
    '</div>'

    window.jQuery('#orcscfiles').html(filesHTML)
  })
}

exports.insertOrcscFiles = function insertOrcscFiles (dir) {
  if (!window.confirm('Πρόκειται να εισάγετε δεδομένα από αρχεία orcsc.\nΘα αντικατασταθούν όλα τα δεδομένα σας.\nΝα προχωρήσω;')) {
    return
  }

  var objkat = {
    'katigories': {
      'katigoria': []
    }
  }
  var objist = {
    'istiodromies': {
      'istiodromia': []
    }
  }
  var objyacht = {
    'yachts': {
      'yacht': []
    }
  }

  glob(dir + '/*.orcsc', null, function (er, files) {
    files.forEach(function (orcscfile) {
      xmlFileToJs(orcscfile, true, function (err, objorcsc) {
        if (err) throw (err)
        if (objorcsc) {
          var eventname = objorcsc.event.Event[0].ROW[0].EventName
          objorcsc.event.Cls[0].ROW.sort(
          firstBy('ClassId')
          )
          objorcsc.event.Cls[0].ROW.forEach(function (ROW) {
            var idxkat = objkat.katigories.katigoria.findIndex(x => x.id === ROW.ClassId[0].replace(/ /g, '_'))
            if (idxkat == -1) { // eslint-disable-line eqeqeq
              objkat.katigories.katigoria.push({'onoma': ROW.ClassName[0], 'id': ROW.ClassId[0].replace(/ /g, '_')})
            }
          })
          jsToXmlFile(katxml, objkat, function (err) {
            if (err) throw (err)
          })

          objorcsc.event.Fleet[0].ROW.sort(
          firstBy('ClassId')
          .thenBy('YachtName')
          )
          objorcsc.event.Fleet[0].ROW.forEach(function (ROW) {
            var idxyacht = objyacht.yachts.yacht.findIndex(x => x.id === ROW.SailNo[0])
            if (idxyacht == -1) { // eslint-disable-line eqeqeq
              objyacht.yachts.yacht.push({'id': ROW.SailNo[0], 'onoma': ROW.YachtName[0], 'yachtkat': ROW.ClassId[0].replace(/ /g, '_'), 'istiodromies': []})
            }
          })
          objorcsc.event.Race[0].ROW.sort(
          firstBy('ClassId')
          .thenBy('RaceName')
          )
          objorcsc.event.Race[0].ROW.forEach(function (ROW) {
            var istiodromia = eventname + ' ' + ROW.RaceName[0]
            var ist = istiodromia.split(' ').map(function (item) { return item[0] + (item[1] ? item[1] : '') }).join('')
            var istid = ist + ROW.ClassId[0].replace(/ /g, '_')
            var datetime = Date.parse(ROW.StartTime)
            var idxist = objist.istiodromies.istiodromia.findIndex(x => x.id === istid)
            if (idxist == -1) { // eslint-disable-line eqeqeq
              objist.istiodromies.istiodromia.push({'onoma': istiodromia, 'id': istid, 'ist': ist, 'nm': ROW.Distance[0].replace(/,/g, '.'), 'baritita': ROW.Coeff[0].replace(/,/g, '_'), 'istkat': ROW.ClassId[0].replace(/ /g, '_'), 'datetime': datetime})
            }
          })

          objkat.katigories.katigoria.forEach(function (itemkat) {
            var istnum = _.filter(objorcsc.event.Race[0].ROW, function (myitem) {
              return myitem.ClassId[0].replace(/ /g, '_') == itemkat.id // eslint-disable-line eqeqeq
            }).length
            if (objist.istiodromies['istnum' + itemkat.id]) {
              istnum = parseInt(istnum) + parseInt(objist.istiodromies['istnum' + itemkat.id])
            }
            objist.istiodromies['istnum' + itemkat.id] = istnum
          })
          // ενημέρωση των μιλίων για ιστιοδρομίες ελεγχόμενου στίβου Αυτό αλλαζει στη γραμμή 34
          objist.istiodromies.nm_eleghomenes = nm4eleghomenes

          objist.istiodromies.istiodromia.sort(
            firstBy('istkat')
            .thenBy('datetime')
          )
          jsToXmlFile(istxml, objist, function (err) {
            if (err) throw (err)
          })

          var results = ''
          objorcsc.event.Rslt[0].ROW.sort(
          firstBy('RaceId')
          .thenBy(function (v) { return parseInt(v.PtsOvl) })
          )
          objorcsc.event.Rslt[0].ROW.forEach(function (ROW) {
            var idxyacht = objorcsc.event.Fleet[0].ROW.findIndex(x => x.YID == ROW.YID[0]) // eslint-disable-line eqeqeq
            var sailnum = objorcsc.event.Fleet[0].ROW[idxyacht].SailNo[0]
            var myidxyacht = objyacht.yachts.yacht.findIndex(x => x.id === sailnum)

            var idxist = objorcsc.event.Race[0].ROW.findIndex(x => x.RaceId == ROW.RaceId[0]) // eslint-disable-line eqeqeq

            var istiodromia = eventname + ' ' + objorcsc.event.Race[0].ROW[idxist].RaceName[0]
            var ist = istiodromia.split(' ').map(function (item) { return item[0] + (item[1] ? item[1] : '') }).join('')
            var istid = ist + objorcsc.event.Race[0].ROW[idxist].ClassId[0].replace(/ /g, '_')
            var datetime = Date.parse(objorcsc.event.Race[0].ROW[idxist].StartTime)
            var myidxist = objyacht.yachts.yacht[myidxyacht].istiodromies.findIndex(x => x.istid === istid)
            if (myidxist == -1) { // eslint-disable-line eqeqeq
              var position
              if (scoreDef[ROW.Finish[0]]) {
                position = scoreDef[ROW.Finish[0]]
              } else {
                position = ROW.PtsOvl[0]
              }
              objyacht.yachts.yacht[myidxyacht].istiodromies.push({'istid': istid, 'istiodromia': ist, 'position': position, 'datetime': datetime})
            }

            results = results + objorcsc.event.Race[0].ROW[idxist].RaceName + ' : '
            results = results + scoreDef[ROW.Finish[0]] + ' : '
            results = results + ROW.PosOvl[0] + ' : '
            results = results + ROW.PtsOvl[0] + '\n'
          })
          objyacht.yachts.yacht.sort(
          firstBy('yachtkat')
          .thenBy('onoma')
          )
          objyacht.yachts.yacht.forEach(function (itemyacht) {
            itemyacht.istiodromies.sort(
              firstBy('datetime')
            )
          })
          jsToXmlFile(yachtxml, objyacht, function (err) {
            if (err) throw (err)
          })
        }
      })
    })
    window.jQuery('#orcscfiles').html('')
    window.jQuery('#filereset').click()
  })
}
