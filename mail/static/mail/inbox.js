document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('form').onsubmit = send;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-details-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      console.log(emails);
      emails.forEach(email => display(email, mailbox));
      });
}

function display(email, mailbox) {
  const divMail = document.createElement('div');
  divMail.style.border = "thin solid #49a8ff";
  divMail.style.textAlign = "center";
  divMail.style.padding = "5px";
  divMail.style.marginBlock = "5px";
  divMail.className = "row";
  divMail.id = "email";

  if (email.read) {
    divMail.style.backgroundColor = "#eeeeee";
  }

  const recipient = document.createElement('div');
  recipient.className = "col-lg-2 col-md-3 col-sm-12";
  recipient.id = "recipient";
  
  if (mailbox === 'inbox') {
    recipient.innerHTML = email.sender;
  } else {
    recipient.innerHTML = email.recipients[0];
  }
  divMail.append(recipient)

  const subject = document.createElement('div');
  subject.className = "col-lg-6 col-md-5 col-sm-12";
  subject.id = "subject";
  subject.innerHTML = email.subject;
  divMail.append(subject)

  const timestamp = document.createElement('div');
  timestamp.className = "col-lg-3 col-md-3 col-sm-12";
  timestamp.id = "timestamp";
  timestamp.innerHTML = email.timestamp;
  divMail.append(timestamp)

  
  console.log(mailbox);
  if (mailbox !== "sent") {
    let label = "";
    if (email.archived === true) {
      label = "Unarchive";
    } else {
      label = "Archive";
    }

    const archiveButton = document.createElement('button')
    archiveButton.id = "archive-button"
    archiveButton.className = "btn btn-sm btn-outline-primary"
    archiveButton.innerHTML = label;

    divMail.append(archiveButton);
    archiveButton.addEventListener('click', () => archive(email.id, email.archived));
  }
  
  const mailCard = document.createElement('div');
  mailCard.id = "email-card";
  mailCard.append(divMail);

  recipient.addEventListener('click', () => display_details(email.id));
  subject.addEventListener('click', () => display_details(email.id));
  timestamp.addEventListener('click', () => display_details(email.id));
  document.querySelector('#emails-view').append(mailCard);
}

function display_details(emailID) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details-view').style.display = 'block';
  document.querySelector('#email-details-view').innerHTML = "";

  const container = document.createElement('div');
  container.className = "container-fluid";
  container.id = "email-container";

  const fromField = document.createElement('div');
  fromField.className = "";
  fromField.id = "from-field";
  container.append(fromField);
  
  const toField = document.createElement('div');
  toField.className = "";
  toField.id = "to-field";
  container.append(toField);
  
  const subjectField = document.createElement('div');
  subjectField.className = "";
  subjectField.id = "subject-field";
  container.append(subjectField);
  
  const timestampField = document.createElement('div');
  timestampField.className = "";
  timestampField.id = "timestamp-field";
  container.append(timestampField);

  container.append(document.createElement('hr'));

  const body = document.createElement('div');
  body.style.border = "thin solid black";
  body.style.paddingBlock = "10px";
  body.style.paddingInline = "10px";
  body.className = "";
  body.id = "email-body";
  body.disabled;
  container.append(body);
  
  container.append(document.createElement('hr'));

  const replyButton = document.createElement('button')
  replyButton.id = "archive-button"
  replyButton.className = "btn btn-sm btn-outline-primary"
  replyButton.innerHTML = "Reply";
  container.append(replyButton);

  fetch(`/emails/${emailID}`)
  .then(response => response.json())
  .then(email => {
    change_read_status(emailID);
    fromField.innerHTML = "<strong>From:</strong> "+email.sender;
    toField.innerHTML = "<strong>To:</strong> "+email.recipients;
    subjectField.innerHTML = "<strong>Subject:</strong> "+email.subject;
    timestampField.innerHTML = "<strong>Timestamp:</strong> "+email.timestamp;
    body.innerHTML = "<strong>Content:</strong> \n\n"+email.body;

    document.querySelector('#email-details-view').append(container);
    replyButton.addEventListener('click', () => reply(email));
  });
  return false;
}

function reply(email) {
  localStorage.clear();
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-details-view').style.display = 'none';

  document.querySelector('#compose-recipients').value = email.sender;
  if (email.subject.indexOf("Re: ") === -1) {
    email.subject = "Re: "+email.subject;
  }
  document.querySelector('#compose-subject').value = email.subject;
  document.querySelector('#compose-body').value = `\n________________\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
}

async function change_read_status(emailID) {
  await fetch(`/emails/${emailID}`, {
    method: 'PUT',
    body: body = JSON.stringify({
      read: true
    })
  })
}

async function archive(emailID, oldArchived) {
  const newArchived = !oldArchived;
  await fetch(`/emails/${emailID}`, {
    method: 'PUT',
    body: body = JSON.stringify({
      archived: newArchived
    })
  });

  load_mailbox('inbox');
}

function send() {
  const body = document.querySelector('#compose-body').value;
  const subject = document.querySelector('#compose-subject').value;
  const recipients = document.querySelector('#compose-recipients').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      if (result.error) {
        console.log(result)
      } else {
        load_mailbox('sent');
      }
  });
  return false;
}