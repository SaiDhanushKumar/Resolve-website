# ResolveNow Central

PS027 : Enterprise Issue Escalation & Service Desk Management System

Business Use Case




The company ResolveNow Service Desk requires an automated ticket management platform to log customer grievances, assign issues to specialized departments, and track resolution lifecycles. ResolveNow must provide real-time ticket updates, ensure transparent department assignments, and deliver automated progress alerts to users. The company specifies a microservices design that decouples complaint intake, department task assignment, and user notification delivery. ResolveNow mandates JWT-secured access controls, an API Gateway for ingress routing, and Eureka service discovery with load balancing to maintain service continuity during high-volume support surges.

The system should: 




Track complaint lifecycle  




Assign issues to departments  




Notify users on updates 




Microservices 




Complaint Service  




Assignment Service  




Notification Service (+ API Gateway, Auth Service, Eureka Server)  




Tasks to be Done 




Implement JWT authentication  




Complaint Service logs issues  




Assignment Service assigns tasks  




Notification Service alerts users  




Inter-service communication (Complaint -> Assignment -> Notification)  




Register services with Eureka  




Route via API Gateway  




Enable Load Balancing  




Write tests  




Deploy application


act as an professional web developer and do this project

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://concern-conqueror.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8ae8d28c-73fd-458a-ba01-afaaa1f3cbae).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
