# Abstract
The rapid pace of the modern work significantly affects employee productivity, job
satisfaction, and employee retention in the long run. Most organizations, however,
currently do not have a unified system that links diverse health-related data for proactive
wellness strategies, despite the obvious connection. This project is about creating an
interactive platform that integrates lifestyle, workplace, and physiological data without any
interruption. Such an integration provides the total employee well-being.
The system, through the use of convincing visualizations and predictive analytics, is
intended to bring to the surface the deeper structures that have a connection with stress
levels, physical activity, and health risks. By making the complex data sets simple and
understandable for action, this platform allows both staff and management to take the rightiv
steps towards healthier work practices. In the end, this project is an example of how
powerful advanced data analytics and visualization techniques can be combined to create
a workforce that is more balanced, productive and health conscious.


# System Architecture
 
<img width="1013" height="592" alt="Screenshot 2026-04-06 at 10 33 01 AM" src="https://github.com/user-attachments/assets/c1ded6ed-bdbd-4887-83f8-f2b3d763b09b" />

 # Datasets 
  - IBM HR Employee Attrition : https://www.kaggle.com/datasets/jazminegreen/ibm-hr-employee-attrition?utm_source=chatgpt.com
  - Sleep, health and lifestyle : https://www.kaggle.com/datasets/uom190346a/sleep-health-and-lifestyle-dataset
  - Apple / other wearable https://www.kaggle.com/datasets/aleespinosa/apple-watch-and-fitbit-data
  - Fitbit Dataset: https://www.kaggle.com/datasets/arashnic/fitbit/data
# Project Overview
# Summary View 
<img width="545" height="629" alt="Screenshot 2026-04-06 at 10 34 55 AM" src="https://github.com/user-attachments/assets/5177c7c4-3641-4042-835b-4c8735b558ae" />

# Group View
<img width="594" height="672" alt="Screenshot 2026-04-06 at 10 35 54 AM" src="https://github.com/user-attachments/assets/02ec5d2c-b4ac-44d1-bef0-d766551b85ad" />

# Individual View
<img width="662" height="587" alt="Screenshot 2026-04-06 at 10 36 34 AM" src="https://github.com/user-attachments/assets/a071e236-6541-4fe4-85c2-5b913fb3172f" />

# ML Model 
    - Gradient Boosting Model
    - Predicts Mental and Physical Health on a score on 1-100
# How to start the code
 (1) frontend npm run dev

 
 (2) backend npm start

 
 (3) ML model (FASTAPI) -  source .venv/bin/activate
                uvicorn app:app --reload --port 8000
 
