from locust import HttpUser, task

class PrimeCheckUser(HttpUser):
    @task
    def prime_check(self):
        self.client.get("/primecheck")