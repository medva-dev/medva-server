const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const file = path.join(__dirname, './db.xlsx');
const db = require('../_init');
const professionsObject = {};
fs.readFileSync(path.join(__dirname, './professions.txt'), 'utf-8')
  .split('\r\n')
  .forEach((x) => {
    const z = x.split('|');
    professionsObject[z[0]] = z[1];
  });

const workbook = XLSX.readFile(file, { cellDates: true, dateNF: 'YYYY-MM-DD' });
const sheet = workbook.Sheets['MedVA - VA Database'];

const data = XLSX.utils.sheet_to_json(sheet, { raw: true, blankrows: false });
parse(data);

function getName(row = {}) {
  let firstName, lastName;

  let fullName = row['VA Name']?.split(',');

  if (fullName.length === 1) {
    fullName = row['VA Name']?.split(' ');
    if (fullName.length > 3 && fullName[2].length > 2) {
      throw new Error(`Invalid full name`);
    }
    lastName = String(fullName[fullName.length - 1]).trim();
    const f = fullName.splice(0, fullName.length - 1);
    firstName = String(f.join(' ')).trim();
  } else {
    lastName = String(fullName[0]).trim();
    fullName.splice(0, 1);
    firstName = String(fullName.join(',')).trim();
  }

  return { firstName, lastName };
}

function getProfessions(row = {}) {
  profession = String(row['Profession'] ?? '')
    .trim()
    .split(',');
  if (profession === 'yes' && profession.indexOf('RN') < 0) {
    if (profession[0] === '') {
      profession[0] = 'RN';
    } else {
      profession.push('RN');
    }
  }

  profession = profession.map((prof) => prof.trim());

  return profession;
}

function getMedicalDegree(row = {}) {
  const value = String(row['Medical Degree'] ?? '').trim();
  const details = {
    'Medical Degree with Limited Experience': {
      degree: true,
      experience: true,
    },
    'Medical Degree with No Experience': {
      degree: true,
      experience: false,
    },
    'Without Medical Degree and No Experience': {
      degree: false,
      experience: false,
    },
    'Without Medical Degree with Limited Experience': {
      degree: false,
      experience: true,
    },
  };

  if (!details[value]) {
    return { degree: false, experience: false };
  }

  return details[value];
}

function getMainSkill(row = {}, index) {
  const value = String(row['VA Main Skill (recruitment)'] ?? '')
    .trim()
    .toUpperCase()
    .split(' ');

  if (value[0] !== 'MEDICAL' && value[0] !== 'DENTAL') {
    return { category: null, subCategory: null };
  }

  return { category: value[0].trim(), subCategory: value[1].trim() };
}

async function parse(data = []) {
  await db.transaction(async (trx) => {
    for await (const [index, row] of data.entries()) {
      if (index < 1278) {
        try {
          const { firstName, lastName } = getName(row, index);

          const hubspotId = row['Record ID'];
          const applicationDate = row['Application Date'];
          const country = row['VA Location'] ?? 'Philippines';
          const professions = getProfessions(row);

          let RN = String(row['RN'] ?? '')
            .toLowerCase()
            .trim();

          professions.forEach((prof) => {
            if (prof === 'RN') {
              RN = 'yes';
            }
          });

          if (RN === 'yes') {
            RN = true;
          } else {
            RN = false;
          }

          const { degree, experience } = getMedicalDegree(row);
          const { category, subCategory } = getMainSkill(row, index);

          const email =
            String(row['Email Address'] ?? '')
              .replace('\r\n', '')
              .trim() || undefined;

          const medvaEmail =
            String(row['MedVA Email Address'] ?? '')
              .replace('\r\n', '')
              .trim() || undefined;

          const phone = row['Cp Number'];
          const address = row['Complete Address'];
          const province = row['City/Province'];
          const region = row['Region'];
          const skype = row['Skype'];
          const birthdate = row['Birthday'];
          // const introVideo = row['Intro Video'];
          // const resume = row['Resume'];
          let relatedSkills = String(row['Other Related Skills'] ?? '').replace(
            'IB/OB',
            'Inbound and Outbound'
          );

          if (relatedSkills !== '') {
            relatedSkills = relatedSkills
              .split('\r\n')
              .join('/')
              .split('/')
              .map((text) => text.replace('\r\n', '').trim());
          }

          if (category && subCategory && relatedSkills.length > 0) {
            const check = await trx('virtualAssistants')
              .where('hubspotId', hubspotId)
              .first();
            if (check) {
              const ins = [];
              relatedSkills.forEach((r) => {
                r = r.replace('"', '').trim();
                if (r != '') {
                  ins.push({ virtualAssistantId: check.id, experience: r });
                }
              });
              if (ins.length > 0) {
                await trx('experiences').insert(ins);
                console.log(
                  `Successfully inserted experience for ${check.firstName} ${check.lastName}`
                );
              }
            }
            // const insert = {
            //   hubspotId,
            //   firstName,
            //   lastName,
            //   applicationDate,
            //   registeredNurse: RN,
            //   medicalDegree: degree,
            //   hasExperience: experience,
            //   category,
            //   subCategory,
            //   email,
            //   medvaEmail,
            //   phone,
            //   address,
            //   province,
            //   region,
            //   skype,
            //   birthdate,
            //   country,
            // };

            // const id = (
            //   await trx('virtualAssistants').insert(insert).returning('id')
            // )?.[0]?.id;

            // console.log(`Successfully inserted ${firstName} ${lastName}`);

            // const finalProfessions = [];
            // if (professions.length > 0) {
            //   professions.forEach((prof) => {
            //     if (prof) {
            //       if (professionsObject[prof]) {
            //         finalProfessions.push({
            //           virtualAssistantId: id,
            //           profession: professionsObject[prof],
            //         });
            //       } else {
            //         console.log({ prof });
            //       }
            //     }
            //   });
            // }

            // if (finalProfessions.length > 0) {
            //   await trx('professions').insert(finalProfessions);
            //   console.log(
            //     `Successfully inserted ${firstName} ${lastName} professions ${JSON.stringify(
            //       professions
            //     )}`
            //   );
            // }
          }
        } catch (e) {
          console.log(index);
          console.log(`Row #`, index + 2, ' - ', e.message);
          process.exit();
        }
      }
    }
  });
  console.log('done?');
  process.exit();
}
