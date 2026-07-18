// ════════════════════════════════════════════════════════════
//  ASB AUTO-MOTO ÉCOLE — Récepteur des Inscriptions → Google Sheet
//  À coller dans : Extensions > Apps Script du Google Sheet
//  ════════════════════════════════════════════════════════════

// ← Optionnel : Mets l'email de l'auto-école ici pour recevoir une alerte par mail
var EMAIL_ASB = "asb.compagnie@gmail.com"; 

var ENTETES = [
  'Date', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Permis souhaité', 'Message', 'Statut'
];

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Inscriptions');
    
    // Si l'onglet n'existe pas, on le crée et on ajoute les en-têtes
    if (!sheet) {
      sheet = ss.insertSheet('Inscriptions');
      sheet.appendRow(ENTETES);
    }
    
    var d = e.parameter;
    
    // Ajout de la ligne d'inscription
    sheet.appendRow([
      new Date(),
      d.prenom || '',
      d.nom || '',
      d.email || '',
      d.tel || '',
      d.permis || '',
      d.msg || '',
      'Nouveau' // Statut initial
    ]);
    
    // Envoi d'un mail d'alerte à l'auto-école
    if (EMAIL_ASB) {
      MailApp.sendEmail({
        to: EMAIL_ASB,
        subject: "🚗 Nouvelle pré-inscription : " + (d.prenom || '') + " " + (d.nom || '') + " — " + (d.permis || ''),
        body:
          "Une nouvelle demande d'inscription a été reçue depuis le site internet :\n\n" +
          "Élève : " + (d.prenom || '') + " " + (d.nom || '') + "\n" +
          "Téléphone : " + (d.tel || '-') + "\n" +
          "Email : " + (d.email || '-') + "\n" +
          "Permis souhaité : " + (d.permis || '-') + "\n\n" +
          "Message de l'élève :\n" + (d.msg || 'Aucun message') + "\n\n" +
          "→ À traiter dans l'onglet Inscriptions de votre Google Sheet."
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Fonction pour formater joliment le tableau (à lancer UNE SEULE FOIS depuis Apps Script) ──
function embellirSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inscriptions');
  if (!sheet) return;
  
  var nbCols = ENTETES.length; // 8 colonnes
  var statutCol = nbCols;
  var lastRow = Math.max(sheet.getLastRow(), 2);
  
  // Style de l'en-tête (Noir & Jaune style ASB !)
  sheet.getRange(1, 1, 1, nbCols)
       .setBackground('#111112').setFontColor('#FFD60A')
       .setFontWeight('bold').setVerticalAlignment('middle');
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
  
  // Ajout de bordures grises discrètes
  sheet.getRange(1, 1, lastRow, nbCols)
       .setBorder(true, true, true, true, true, true, '#E4E7EC', SpreadsheetApp.BorderStyle.SOLID);
  
  // Menu déroulant de statut
  var statuts = ['Nouveau', 'À recontacter', 'Inscrit', 'Sans suite'];
  var val = SpreadsheetApp.newDataValidation().requireValueInList(statuts, true).setAllowInvalid(false).build();
  sheet.getRange(2, statutCol, 1000, 1).setDataValidation(val);
  
  // Mise en forme conditionnelle des lignes de statut
  var r = sheet.getRange(2, statutCol, 1000, 1);
  function regle(t, fond, police) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(t).setBackground(fond).setFontColor(police).setRanges([r]).build();
  }
  sheet.setConditionalFormatRules([
    regle('Nouveau', '#FEF3E0', '#8A5A12'),      // Orange clair
    regle('À recontacter', '#E6EEFB', '#1E40AF'), // Bleu clair
    regle('Inscrit', '#E4F1E8', '#177245'),       // Vert clair
    regle('Sans suite', '#F0F0F0', '#6B7280')     // Gris clair
  ]);
}
