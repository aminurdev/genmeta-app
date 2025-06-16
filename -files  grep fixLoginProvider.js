[33mcommit 0e546083e5ee43845cb390c757db336892a9fd1c[m
Author: Aminur Rahman <dev.aminur@gmail.com>
Date:   Mon Jun 16 13:30:04 2025 +0600

    chore: remove fixLoginProvider.js and update .gitignore to exclude it

[33mcommit b2bdcb4e1e6415b9d2b1be6c2f610afa5ba16764[m
Author: Aminur Rahman <dev.aminur@gmail.com>
Date:   Mon Jun 16 13:21:37 2025 +0600

    Refactor login provider connection and enhance user schema validation
    
    - Updated MongoDB connection string to use Atlas.
    - Added user schema with comprehensive validation for fields including name, email, password, and login provider.
    - Implemented email format validation and conditional password requirement based on login provider.
    - Defined roles and default values for user attributes.

[33mcommit 6c80e1832f4e5aa18ec6b08814832137f8541f30[m
Author: Aminur Rahman <dev.aminur@gmail.com>
Date:   Sun Jun 15 14:31:30 2025 +0600

    feat: Implement login provider fix script and enhance user registration flow
    
    - Added a script to fix loginProvider format in the database.
    - Refactored user registration to use a dedicated function for OTP and token generation.
    - Introduced a new endpoint to resend verification emails.
    - Improved error handling and response messages for email verification and login processes.
    - Updated user verification logic to ensure proper user state management.
