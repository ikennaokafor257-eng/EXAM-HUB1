const postGrid = document.getElementById('postGrid');
const adminPosts = document.getElementById('adminPosts');
const adminCount = document.getElementById('adminCount');
const announcementCount = document.getElementById('announcementCount');
const modeToggle = document.getElementById('modeToggle');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const contactForm = document.getElementById('contactForm');
const formResponse = document.getElementById('formResponse');
const scrollItems = document.querySelectorAll('.reveal');
const counters = [
  { id: 'counter1', target: 320 },
  { id: 'counter2', target: 780 },
  { id: 'counter3', target: 180 }
];

const storageKey = 'examHubPosts';
const pinsKey = 'examHubSubjectPins';
const unlockedKey = 'examHubUnlockedSubjects';
const authKey = 'examHubAdminAuth';
const passwordKey = 'examHubAdminPassword';

const posts = JSON.parse(localStorage.getItem(storageKey) || '[]');
const savedPins = JSON.parse(localStorage.getItem(pinsKey) || '{}');
const savedSessionUnlocks = JSON.parse(sessionStorage.getItem(unlockedKey) || '[]');
const savedLegacyUnlocks = JSON.parse(localStorage.getItem(unlockedKey) || '[]');
const unlockedSubjects = new Set(savedSessionUnlocks);
const subjectPins = {
  WAEC: savedPins.WAEC || '',
  NECO: savedPins.NECO || '',
  JAMB: savedPins.JAMB || '',
  PREMIUM: savedPins.PREMIUM || ''
};

const pinForm = document.getElementById('pinForm');
const pinWaec = document.getElementById('pinWaec');
const pinNeco = document.getElementById('pinNeco');
const pinJamb = document.getElementById('pinJamb');
const pinPremium = document.getElementById('pinPremium');
const postForm = document.getElementById('postForm');
const adminLockScreen = document.getElementById('adminLockScreen');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminPasswordInput = document.getElementById('adminPassword');
const adminPasswordConfirmInput = document.getElementById('adminPasswordConfirm');
const adminConfirmGroup = document.getElementById('adminConfirmGroup');
const adminLockTitle = document.getElementById('adminLockTitle');
const adminLockMessage = document.getElementById('adminLockMessage');
const adminLoginButton = document.getElementById('adminLoginButton');
const adminLoginError = document.getElementById('adminLoginError');
const adminContent = document.getElementById('adminContent');
const logoutLink = document.getElementById('logoutLink');
const pageLoader = document.getElementById('pageLoader');

function getSavedAdminPassword() {
  return localStorage.getItem(passwordKey) || '';
}

function isAdminPasswordSet() {
  return getSavedAdminPassword().length > 0;
}

function setAdminPassword(value) {
  localStorage.setItem(passwordKey, value);
}

function validateAdminPassword(password) {
  return password === getSavedAdminPassword();
}

function isAdminAuthenticated() {
  return sessionStorage.getItem(authKey) === 'true';
}

function setAdminAuthenticated(value) {
  sessionStorage.setItem(authKey, value ? 'true' : 'false');
  if (value) {
    document.body.classList.remove('locked');
    if (adminLockScreen) adminLockScreen.style.display = 'none';
    if (adminContent) adminContent.style.display = 'block';
  } else {
    document.body.classList.add('locked');
    if (adminLockScreen) adminLockScreen.style.display = 'grid';
    if (adminContent) adminContent.style.display = 'none';
  }
}

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

function savePins() {
  subjectPins.PREMIUM = pinPremium ? pinPremium.value.trim() : subjectPins.PREMIUM;
  localStorage.setItem(pinsKey, JSON.stringify(subjectPins));
  if (pinWaec) pinWaec.value = subjectPins.WAEC;
  if (pinNeco) pinNeco.value = subjectPins.NECO;
  if (pinJamb) pinJamb.value = subjectPins.JAMB;
  if (pinPremium) pinPremium.value = subjectPins.PREMIUM;
}

function renderPins() {
  if (!pinForm) return;
  if (pinWaec) pinWaec.value = subjectPins.WAEC;
  if (pinNeco) pinNeco.value = subjectPins.NECO;
  if (pinJamb) pinJamb.value = subjectPins.JAMB;
  if (pinPremium) pinPremium.value = subjectPins.PREMIUM;
}

function clearLegacyUnlockStorage() {
  if (savedLegacyUnlocks.length > 0) {
    localStorage.removeItem(unlockedKey);
  }
}

function normalizeUnlockedSubjects() {
  const validPostIds = new Set(posts.map(post => post.created));
  const currentUnlocked = [...unlockedSubjects].filter(postId => validPostIds.has(postId));
  if (currentUnlocked.length !== unlockedSubjects.size) {
    unlockedSubjects.clear();
    currentUnlocked.forEach(postId => unlockedSubjects.add(postId));
    sessionStorage.setItem(unlockedKey, JSON.stringify([...unlockedSubjects]));
  }
}

function configureAdminLockUI() {
  if (!adminLoginForm) return;
  const passwordSet = isAdminPasswordSet();
  if (adminLockTitle) adminLockTitle.textContent = passwordSet ? 'Admin Access Required' : 'Create Admin Password';
  if (adminLockMessage) adminLockMessage.textContent = passwordSet ? 'Enter your admin password to manage posts and updates.' : 'Set your own admin password to lock access to the dashboard.';
  if (adminConfirmGroup) adminConfirmGroup.classList.toggle('hidden', passwordSet);
  if (adminLoginButton) adminLoginButton.textContent = passwordSet ? 'Unlock Admin' : 'Create Password';
  if (adminPasswordConfirmInput) adminPasswordConfirmInput.required = !passwordSet;
}

function renderPosts() {
  if (!postGrid && !adminPosts) return;
  if (postGrid) postGrid.innerHTML = '';
  if (adminPosts) adminPosts.innerHTML = '';

  if (postGrid && posts.length === 0) {
    postGrid.innerHTML = `
      <div class="empty-state glass-card">
        <p>No updates yet. Check back soon for premium exam updates.</p>
      </div>
    `;
  }

  posts.slice().reverse().forEach((post, index) => {
    const originalIndex = posts.length - 1 - index;
    if (postGrid) {
      const item = createPublicPostCard(post, originalIndex);
      postGrid.appendChild(item);
    }
    if (adminPosts) {
      const adminItem = createAdminPostItem(post, originalIndex);
      adminPosts.appendChild(adminItem);
    }
  });

  if (adminCount) adminCount.textContent = posts.length;
  if (announcementCount) announcementCount.textContent = posts.filter(item => item.category === 'VIP' || item.category === 'Midnight').length;
}

function savePosts() {
  localStorage.setItem(storageKey, JSON.stringify(posts));
  renderPosts();
}

function createPublicPostCard(post, index) {
  const card = document.createElement('article');
  card.className = 'post-item glass-card';
  const hasAnswer = Boolean(post.answer && post.answer.trim().length > 0);
  const locked = hasAnswer && !unlockedSubjects.has(post.created);
  const unlockHint = post.category && subjectPins[post.category] ? post.category : 'Premium';

  card.innerHTML = `
    <div class="post-meta">
      <span>${post.category}</span>
      <span>${formatDate(post.created)}</span>
    </div>
    <h4>${post.title}</h4>
    <p>${post.text}</p>
    ${post.image ? `<img src="${post.image}" alt="${post.title}" class="post-image" />` : ''}
    ${locked ? `<div class="locked-banner">Locked answer. Enter the ${unlockHint} PIN to view it.</div>
      <button class="unlock-button" data-post-id="${post.created}" data-category="${post.category}">Unlock with PIN</button>` : ''}
    ${!locked && hasAnswer ? `<div class="post-answer"><strong>Answer / Solution:</strong><p>${post.answer}</p></div>` : ''}
  `;

  if (locked) {
    const unlockButton = card.querySelector('.unlock-button');
    if (unlockButton) {
      unlockButton.addEventListener('click', () => unlockSubject(unlockButton.dataset.postId, unlockButton.dataset.category));
    }
  }

  return card;
}

function createAdminPostItem(post, index) {
  const adminItem = document.createElement('div');
  adminItem.className = 'post-admin-item';
  adminItem.innerHTML = `
    <div class="post-admin-meta">
      <span>${post.category}</span>
      <span>${new Date(post.created).toLocaleString()}</span>
    </div>
    <h4>${post.title}</h4>
    <p>${post.text}</p>
    ${post.answer ? `<p><strong>Answer:</strong> ${post.answer}</p>` : ''}
    <div class="post-admin-actions">
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    </div>
  `;

  const editBtn = adminItem.querySelector('.edit-btn');
  const deleteBtn = adminItem.querySelector('.delete-btn');

  editBtn.addEventListener('click', () => startEditPost(index));
  deleteBtn.addEventListener('click', () => deletePost(index));

  return adminItem;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function handlePostSubmit(event) {
  event.preventDefault();
  const title = document.getElementById('postTitle').value.trim();
  const category = document.getElementById('postCategory').value;
  const text = document.getElementById('postText').value.trim();
  const answer = document.getElementById('postAnswer').value.trim();
  const imageUrl = document.getElementById('postImage').value.trim();
  const imageFileInput = document.getElementById('postImageFile');
  const submitButton = postForm.querySelector('button');

  if (!title || !text) return;

  let image = imageUrl;
  if (imageFileInput && imageFileInput.files && imageFileInput.files[0]) {
    try {
      image = await fileToDataUrl(imageFileInput.files[0]);
    } catch (error) {
      console.error('Image load failed', error);
    }
  }

  const editingIndex = submitButton.dataset.editing;
  if (editingIndex !== undefined) {
    posts[editingIndex] = {
      ...posts[editingIndex],
      title,
      category,
      text,
      answer,
      image: image || posts[editingIndex].image || '',
      created: posts[editingIndex].created,
    };
    submitButton.textContent = 'Publish Update';
    delete submitButton.dataset.editing;
  } else {
    posts.push({
      title,
      category,
      text,
      answer,
      image,
      created: new Date().toISOString(),
    });
  }

  savePosts();
  postForm.reset();
  if (document.getElementById('adminResponse')) {
    document.getElementById('adminResponse').textContent = 'Post saved successfully.';
    setTimeout(() => { document.getElementById('adminResponse').textContent = ''; }, 3000);
  }
}

function startEditPost(postIndex) {
  const post = posts[postIndex];
  const titleField = document.getElementById('postTitle');
  const categoryField = document.getElementById('postCategory');
  const textField = document.getElementById('postText');
  const answerField = document.getElementById('postAnswer');
  const imageField = document.getElementById('postImage');
  const imageFileInput = document.getElementById('postImageFile');

  if (titleField && categoryField && textField && answerField && imageField) {
    titleField.value = post.title;
    categoryField.value = post.category;
    textField.value = post.text;
    answerField.value = post.answer || '';
    imageField.value = post.image || '';
    if (imageFileInput) imageFileInput.value = '';
    const submitButton = document.querySelector('#postForm button');
    submitButton.textContent = 'Update Post';
    submitButton.dataset.editing = postIndex.toString();
  }
}

function deletePost(postIndex) {
  posts.splice(postIndex, 1);
  savePosts();
}

function unlockSubject(postId, category) {
  const categoryPin = subjectPins[category];
  const globalPin = subjectPins.PREMIUM;
  const pinLabel = categoryPin ? category : 'Premium';
  const pinToCheck = categoryPin || globalPin;

  if (!pinToCheck) {
    alert(`No PIN set for this answer category. Please set a premium PIN in the Admin Panel first.`);
    return;
  }

  const pinValue = prompt(`Enter the ${pinLabel} PIN to unlock answers:`);
  if (pinValue === pinToCheck) {
    unlockedSubjects.add(postId);
    sessionStorage.setItem(unlockedKey, JSON.stringify([...unlockedSubjects]));
    localStorage.removeItem(unlockedKey);
    renderPosts();
    alert(`Answer unlocked successfully.`);
  } else {
    alert('Incorrect PIN. Please try again.');
  }
}

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    contactForm.reset();
    formResponse.textContent = `Message received from ${name}. We'll respond soon.`;
    setTimeout(() => formResponse.textContent = '', 4000);
  });
}

if (postForm) {
  postForm.addEventListener('submit', handlePostSubmit);
}

if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const password = adminPasswordInput.value.trim();
    const confirmPassword = adminPasswordConfirmInput ? adminPasswordConfirmInput.value.trim() : '';

    if (!isAdminPasswordSet()) {
      if (!password || !confirmPassword) {
        if (adminLoginError) adminLoginError.textContent = 'Please enter and confirm your new password.';
        return;
      }
      if (password !== confirmPassword) {
        if (adminLoginError) adminLoginError.textContent = 'Passwords do not match. Try again.';
        return;
      }
      setAdminPassword(password);
      setAdminAuthenticated(true);
      if (adminLoginError) adminLoginError.textContent = '';
      adminPasswordInput.value = '';
      if (adminPasswordConfirmInput) adminPasswordConfirmInput.value = '';
      configureAdminLockUI();
      return;
    }

    if (validateAdminPassword(password)) {
      setAdminAuthenticated(true);
      adminPasswordInput.value = '';
      if (adminLoginError) adminLoginError.textContent = '';
    } else {
      if (adminLoginError) adminLoginError.textContent = 'Incorrect password. Try again.';
    }
  });
}

if (logoutLink) {
  logoutLink.addEventListener('click', (event) => {
    event.preventDefault();
    setAdminAuthenticated(false);
    sessionStorage.removeItem(authKey);
    window.location.reload();
  });
}

if (pinForm) {
  pinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    subjectPins.WAEC = pinWaec.value.trim();
    subjectPins.NECO = pinNeco.value.trim();
    subjectPins.JAMB = pinJamb.value.trim();
    savePins();
    const response = document.getElementById('pinResponse');
    if (response) {
      response.textContent = 'Pins saved successfully.';
      setTimeout(() => { response.textContent = ''; }, 3000);
    }
  });
}

if (modeToggle) {
  modeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    modeToggle.textContent = document.body.classList.contains('light') ? '🌞' : '🌙';
  });
}

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

window.addEventListener('scroll', () => {
  scrollItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      item.classList.add('visible');
    }
  });
});

function animateCounters() {
  counters.forEach(counter => {
    const element = document.getElementById(counter.id);
    if (!element) return;
    let start = 0;
    const duration = 1400;
    const step = Math.ceil(counter.target / (duration / 40));
    const interval = setInterval(() => {
      start += step;
      element.textContent = start > counter.target ? counter.target : start;
      if (start >= counter.target) clearInterval(interval);
    }, 40);
  });
}

function initTyping() {
  const textElement = document.querySelector('.glow-text');
  if (!textElement) return;
  const fullText = 'WAEC, NECO & JAMB Updates';
  let index = 0;
  textElement.textContent = '';
  const typingInterval = setInterval(() => {
    textElement.textContent += fullText[index];
    index += 1;
    if (index >= fullText.length) clearInterval(typingInterval);
  }, 70);
}

function hideLoader() {
  if (pageLoader) {
    pageLoader.style.opacity = '0';
    pageLoader.style.pointerEvents = 'none';
    setTimeout(() => {
      if (pageLoader) pageLoader.style.display = 'none';
    }, 500);
  }
}

function init() {
  renderPins();
  clearLegacyUnlockStorage();
  normalizeUnlockedSubjects();
  renderPosts();
  animateCounters();
  initTyping();
  hideLoader();
  if (adminLockScreen) {
    configureAdminLockUI();
    setAdminAuthenticated(isAdminAuthenticated());
  }
}

window.addEventListener('load', init);
