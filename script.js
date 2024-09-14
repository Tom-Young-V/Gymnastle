let skills = [];
let selectedSkill = null; // Variable to store the selected skill
let guessCount = 0;
let viableOnly = false;
let guessedSkills = [];
let viableSkills;
let skillOfTheDay;
let hintText;
let funFact;
let displayGuessBox = false;
let gray = "rgb(224, 224, 224)";
let yellow = "rgb(235, 242, 12)";
let green = "rgb(0, 163, 5)";

// Function to load the skills from the JSON file
function loadSkills() {
    fetch("Men's Gymnastics Skills.json")
        .then(response => response.json())
        .then(data => {
            skills = [];
            // Traverse through the JSON data to build the skills array
            for (const event in data) {
                const elementGroups = data[event];
                for (const elementGroup in elementGroups) {
                    const boxes = elementGroups[elementGroup];
                    for (const box in boxes) {
                        const skill = boxes[box];
                        skill.eventName = event; // Add eventName to the skill object
                        skill.elementGroup = elementGroup; // Add element group to the skill object
                        skills.push(skill);
                    }
                }
            }

            getSkillOfTheDay();

            viableSkills = skills

        })
        .catch(error => console.error('Error fetching JSON data:', error));
}

async function getSkillOfTheDay() {
    try {
        const response = await fetch('Skill of the Day.json');
        const data = await response.json();
        
        
        // Get today's date in Seattle time zone (Pacific Time)
        const today = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
        
        // Convert today's date to YYYY-MM-DD format
        const formattedToday = new Date(today).toISOString().split('T')[0];
        
        // Find the set for today
        var todayData = data.find(item => item.date === formattedToday);

        if (!todayData) {
            todayData = data[0];
        }
        
        if (todayData) {
            skillOfTheDay = getSkill(todayData.skillOfTheDay);

            hintText = todayData.hintText;
            funFact = todayData.funFact;

            console.log('Skill of the Day:', skillOfTheDay);
        } else {
            console.error('No data available for today.');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }

}

function getSkill(skillName) {
    for (const [index, skill] of skills.entries()) {
        if (skill.name === skillName) {
            return skill;
        }
    }
}

// Function to format the skill display as required
function formatSkillDisplay(skill) {
    let skillText = `${skill.eventName}: `;
    if (skill.alternateNames && skill.alternateNames.length > 0) {
        skillText += `${skill.alternateNames.join("/")} - `;
    }
    skillText += skill.name;

    return skillText;
}

function arraysEqual(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((val, index) => val === arr2[index]);
}

function getResults(skill1, skill2) {
    return [
        ...compareValue(skill1, skill2), // Spread the array returned by compareValue
        compareEvent(skill1, skill2),    // Single value, no need to spread
        ...compareEG(skill1, skill2)     // Spread the array returned by compareEG
    ];
}

function getViableSkills(addedSkill) {
    const newViableSkills = [];

    addedSkillResults = getResults(addedSkill, skillOfTheDay);
    
    viableSkills.forEach((skill) => {
        const currentSkillResults = getResults(addedSkill, skill);

        // Compare the arrays using arraysEqual
        if (arraysEqual(currentSkillResults, addedSkillResults)) {
            newViableSkills.push(skill);
        }

    });

    viableSkills = newViableSkills
}

// Function to update matches based on the guess
function updateMatches() {
    const guess = document.getElementById('skill-guess').value;
    const regex = new RegExp(guess, 'i'); // Case-insensitive regex
    const skills_container = document.getElementById('skills-container');
    const explanationText = document.getElementById('explanation-text');

    if (guess.trim() !== '') {
        explanationText.style.display = 'none';
    } else {
        if (! displayGuessBox) {
            explanationText.style.display = 'block';
        }
        skills_container.innerHTML = ''; // Clear matches when input is empty
        return;
    }

    // Clear previous matches
    skills_container.innerHTML = '';

    // Separate matches into two groups: one for alternate names and one for regular names
    const altNameMatches = skills.filter(skill => skill.alternateNames && skill.alternateNames.some(altName => regex.test(altName)));
    const nameMatches = skills.filter(skill => regex.test(skill.event + skill.name) && !altNameMatches.includes(skill)); // Exclude already matched skills by alternate name

    // Combine both types of matches, starting with alternate name matches first
    const allMatches = [...altNameMatches, ...nameMatches];
    const limited_matches = []

    allMatches.forEach((match) => {
        if (viableOnly) {
            if (viableSkills.includes(match)) {
                limited_matches.push(match)
            }
        } else {
            limited_matches.push(match)
        }
    });

    // Display matches
    if (limited_matches.length > 0) {
        limited_matches.forEach(skill => {
            const skillDiv = document.createElement('div');
            skillDiv.className = 'match';
            
            // Build the skill text (Event, Alternate Name if available, and Description)
            let skillText = formatSkillDisplay(skill);
            skillDiv.textContent = skillText;

            // Add click event listener to select the skill
            skillDiv.addEventListener('click', () => selectSkill(skill));

            skills_container.appendChild(skillDiv);
        });
    } else {
        skills_container.textContent = 'No matches found';
    }
}

// Function to select the skill when the skill match is clicked
function selectSkill(skill) {
    selectedSkill = skill; // Mark the skill as selected
    const skillGuessInput = document.getElementById('skill-guess');
    const submitButton = document.getElementById('submit-skill');

    // Display the selected skill in the input box
    skillGuessInput.value = formatSkillDisplay(skill);

    // Change input box to blue, show submit button, display images
    skillGuessInput.style.backgroundColor = '#add8e6'; // Light blue
    submitButton.style.display = 'block';
    displaySkillImages(skill);

    // Stop searching for matches when skill is selected
    document.getElementById('skills-container').innerHTML = ''; // Clear matches

    document.getElementById('filter-div').style.display = 'none';
}

// Function to reset the selected skill when the input is edited
function deselectSkill(fullyDisselect) {
    if (! selectedSkill)
    selectedSkill = null; // Reset selected skill
    const skillGuessInput = document.getElementById('skill-guess');
    const submitButton = document.getElementById('submit-skill');
    const skillImageContainer = document.getElementById('skill-image-container');

    // Reset input box to white, hide submit button, remove images
    skillGuessInput.style.backgroundColor = '#ffffff';
    if (fullyDisselect) {
        skillGuessInput.value = '';
    } else {
        document.getElementById('explanation-text').display = 'block';
    }
    submitButton.style.display = 'none';
    skillImageContainer.innerHTML = ''; // Remove images

    document.getElementById('filter-div').style.display = 'block';

    // Resume searching for matches
    updateMatches();
}

// Gets the images based on a skill
function getImagePaths(skill) {
    const { eventName, elementGroup, boxNumber, images } = skill;
    const imagePaths = [];

    for (let i = 0; i < images; i++) {
        const imagePath = `Skill Images/${eventName}/${elementGroup}/Box ${boxNumber}-Image_${i} Transparent.png`;
        imagePaths.push(imagePath);
    }

    return imagePaths;
}

// Function to display skill images and symbols
function displaySkillImages(skill) {
    const skillImageContainer = document.getElementById('skill-image-container');
    skillImageContainer.innerHTML = ''; // Clear previous images

    const imagePaths = getImagePaths(skill);

    imagePaths.forEach((imagePath, index) => {
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = `Image ${index}`;
        skillImageContainer.appendChild(img);
    });
}

// Function to convert value to a comparable numerical format
function convertValue(value) {
    if (isNaN(value)) {
        // Convert letters A-Z to numerical values (A=0.1, B=0.2, ..., Z=2.6)
        const letterValue = value.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
        return letterValue;
    } else {
        // Convert numerical values to float
        return parseFloat(value) * 10;
    }
}

// Function to compare values and return color and symbol
function compareValue(skill1, skill2) {
    const valueOfTheDay = convertValue(skill2.value);
    const skillValue = convertValue(skill1.value);
    
    const diff = skillValue - valueOfTheDay;
    let symbol = '';

    // Determine the symbol based on the comparison
    if (diff > 0) {
        symbol = ' ▼';
    } else if (diff < 0) {
        symbol = ' ▲';
    }

    // Compare values
    if (skillValue === valueOfTheDay) {
        // Exact match
        return [green, ''];
    } else if (valueOfTheDay > 10 && skillValue > 10) {
        if (Math.abs(diff) <= 4) {
            return [yellow, symbol];
        }
    } else {
        // Both are numbers
        if (Math.abs(diff) <= 1) {
            return [yellow, symbol];
        }
    }

    // No close match
    return [gray, symbol];
}

function compareEvent(skill1, skill2) {
    const eventOrder = [
        "Floor Exercise",
        "Pommel Horse",
        "Rings",
        "Vault",
        "Parallel Bars",
        "High Bar"
    ];

    const index1 = eventOrder.indexOf(skill1.event);
    const index2 = eventOrder.indexOf(skill2.event);

    if (index1 === index2) {
        return green;
    } else if (Math.abs(index1 - index2) === 1) {
        return yellow;
    } else {
        return gray;
    }
}

function compareEG(skill1, skill2) {
    const egOrder = [
        "EG I",
        "EG II",
        "EG III",
        "EG IV",
        "EG V"
    ];
    const diff = egOrder.indexOf(skill1.elementGroup) - egOrder.indexOf(skill2.elementGroup);
    const symbol = diff > 0 ? ' ▼' : ' ▲';

    if (diff === 0) {
        // Exact match
        return [green, ''];
    } else if (Math.abs(diff) === 1) {
        // Within 1 letter
        return [yellow, symbol];
    } else {
        // No close match
        return [gray, symbol];
    }
}

// Function to add a guess to the guess-box
function addGuess(skill) {
    guessCount += 1

    if (guessCount >= 2) {
        const revealButton = document.getElementById('reveal-button');
        revealButton.style.display = 'block';
    }
    
    console.log("Selected", skill)

    if (! displayGuessBox) {
        displayGuessBox = true
        const guessBox = document.querySelector(".guess-box");
        guessBox.style.display = 'block';
    }

    const selectedSkillContainer = document.getElementById('selected-skill-container');

    // Create a div for this skill's info
    const skillInfoDiv = document.createElement('div');
    skillInfoDiv.classList.add('skill-info');

    // Create a flex container for name and image
    const skillContentDiv = document.createElement('div');
    skillContentDiv.classList.add('skill-content');

    // Create the name element
    const skillName = document.createElement('h3');
    if (skill.alternateNames && skill.alternateNames.length > 0) {
        skillName.textContent = `${skill.alternateNames.join("/")} - ` + skill.name;
    } else {
        skillName.textContent = skill.name;
    }
    skillContentDiv.appendChild(skillName);

    // Create the image element
    const imagePath = getImagePaths(skill)[0];

    if (imagePath) {
        const skillImage = document.createElement('img');
        skillImage.src = imagePath;
        skillImage.alt = `${skill.name} Image`;
        skillImage.classList.add('skill-image');
        skillContentDiv.appendChild(skillImage);
    }

    // Append the content div to the skill info div
    skillInfoDiv.appendChild(skillContentDiv);

    // Create value, event, and element group boxes
    const infoContainer = document.createElement('div');
    infoContainer.classList.add('info-container');

    [ color, symbol ] = compareValue(skill, skillOfTheDay);
    const valueDiv = document.createElement('div');
    valueDiv.classList.add('info-box');
    valueDiv.textContent = `Value: ${skill.value}${symbol}`;
    valueDiv.style.backgroundColor = color;
    infoContainer.appendChild(valueDiv);

    color = compareEvent(skill, skillOfTheDay);
    const eventDiv = document.createElement('div');
    eventDiv.classList.add('info-box');
    eventDiv.textContent = `${skill.eventName}`;
    eventDiv.style.backgroundColor = color;
    infoContainer.appendChild(eventDiv);

    [ color, symbol ] = compareEG(skill, skillOfTheDay);
    const elementGroupDiv = document.createElement('div');
    elementGroupDiv.classList.add('info-box');
    elementGroupDiv.textContent = `Group ${skill.elementGroup.slice(3)}${symbol}`;
    elementGroupDiv.style.backgroundColor = color;
    infoContainer.appendChild(elementGroupDiv);

    // Append the info container to the skill info div
    skillInfoDiv.appendChild(infoContainer);

    // Append the entire skill info div to the selected skill container
    selectedSkillContainer.appendChild(skillInfoDiv);

    if (valueDiv.style.backgroundColor === green && eventDiv.style.backgroundColor === green && elementGroupDiv.style.backgroundColor === green && skill !== skillOfTheDay) {
        document.querySelector(".not-right").style.display = "block";
    }

    if (skill === skillOfTheDay) {
        activateVictory();
        return;
    }

    getViableSkills(skill);
}

function activateVictory() {
    console.log("You win!")
    document.querySelector(".game-box").style.display = "none";
    document.querySelector(".hint").style.display = "none";

    const victoryBox = document.querySelector('.victory-box');

    const victoryMessage = document.createElement('h2');
    if (guessCount === 1) {
        victoryMessage.textContent = `You won in 1 guess!`;
    } else {
        victoryMessage.textContent = `You won in ${guessCount} guess!`;
    }
    victoryBox.appendChild(victoryMessage);

    // Create a new div for the fun fact
    const funFactDiv = document.createElement('div');
    funFactDiv.classList.add('fun-fact');
    funFactDiv.textContent = funFact;

    // Append the fun fact div to the victory box
    victoryBox.appendChild(funFactDiv);

    // Make the victory box visible (if hidden initially)
    victoryBox.style.display = 'block';
}

// Function to handle the hint button click
document.getElementById('hint-button').addEventListener('click', function() {
    const hintTextElement = document.getElementById('hint-text');
    hintTextElement.textContent = hintText; // Set the hint text
    hintTextElement.style.display = 'block'; // Reveal the hint text
    this.style.display = 'none'; // Hide the button after clicking
});

// Function to handle the revea, button click
document.getElementById('reveal-button').addEventListener('click', function() {
    addGuess(skillOfTheDay);
});

// Function to handle submit button click
document.getElementById('submit-skill').addEventListener('click', () => {
    if (selectedSkill) {
        deselectSkill(true);
        addGuess(selectedSkill)
    }
});


document.getElementById('filter-checkbox').addEventListener('change', (event) => {
    viableOnly = event.target.checked; // Update viableOnly based on checkbox state

    // Function to update the skill display based on filter
    updateMatches();
});

// Event listener for input changes
document.getElementById('skill-guess').addEventListener('input', function () {
    if (selectedSkill) {
        deselectSkill(false); // If user edits the input, reset the selection
    } else {
        updateMatches(); // Otherwise, keep searching for matches
    }
});


// let currentSkillIndex = -1
// document.getElementById('skill-guess').addEventListener('click', function () {
//     console.log("Yeah")
//     deselectSkill(true)
    
//     currentSkillIndex = (currentSkillIndex + 1) % skills.length; // Move to next skill (loop around if at the end)
//     const nextSkill = skills[currentSkillIndex];
//     selectSkill(nextSkill); // Select the next skill
// });


window.onload = loadSkills;
