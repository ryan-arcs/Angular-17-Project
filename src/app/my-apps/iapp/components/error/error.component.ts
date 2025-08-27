import { Component, Input, OnInit } from '@angular/core';
import { ApiResponseInterface } from '../../interfaces/apiResponse';
import { IappGlobalDataService } from '../../services';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [],
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss',
})
export class ErrorComponent implements OnInit {
  @Input() showQuotes = true;

  constructor(private iappGlobalDataService: IappGlobalDataService) {}

  ngOnInit(): void {
    this.getRandomMotivationalQuote();
    this.iappGlobalDataService.apiResponse$.subscribe({
      next: (data) => {
        this.apiResponse = data;
      },
    });
  }

  apiResponse: ApiResponseInterface = {
    statusCode: 404,
    statusMessage: '',
    statusDescription: '',
  };
  motivationalQuote!: string;
  motivationalQuoteAuthor!: string;
  motivationalQuotesList = [
    {
      quote: 'The only way to do great work is to love what you do.',
      author: 'Steve Jobs',
    },
    {
      quote:
        'Success is not the key to happiness. Happiness is the key to success.',
      author: 'Albert Schweitzer',
    },
    {
      quote: "Don't watch the clock; do what it does. Keep going.",
      author: 'Sam Levenson',
    },
    {
      quote:
        'The future belongs to those who believe in the beauty of their dreams.',
      author: 'Eleanor Roosevelt',
    },
    {
      quote:
        'The only limit to our realization of tomorrow is our doubts of today.',
      author: 'Franklin D. Roosevelt',
    },
    {
      quote: 'Act as if what you do makes a difference. It does.',
      author: 'William James',
    },
    {
      quote:
        'Success usually comes to those who are too busy to be looking for it.',
      author: 'Henry David Thoreau',
    },
    {
      quote: "Don't be afraid to give up the good to go for the great.",
      author: 'John D. Rockefeller',
    },
    {
      quote: 'I find that the harder I work, the more luck I seem to have.',
      author: 'Thomas Jefferson',
    },
    {
      quote: "Opportunities don't happen. You create them.",
      author: 'Chris Grosser',
    },
    {
      quote: "Don't let yesterday take up too much of today.",
      author: 'Will Rogers',
    },
    {
      quote: "It's not whether you get knocked down, it's whether you get up.",
      author: 'Vince Lombardi',
    },
    {
      quote:
        "If you are working on something that you really care about, you don't have to be pushed. The vision pulls you.",
      author: 'Steve Jobs',
    },
    {
      quote:
        'People who are crazy enough to think they can change the world, are the ones who do.',
      author: 'Rob Siltanen',
    },
    {
      quote:
        'Failure will never overtake me if my determination to succeed is strong enough.',
      author: 'Og Mandino',
    },
    {
      quote: 'We may encounter many defeats but we must not be defeated.',
      author: 'Maya Angelou',
    },
    {
      quote:
        'Knowing is not enough; we must apply. Wishing is not enough; we must do.',
      author: 'Johann Wolfgang von Goethe',
    },
    {
      quote: 'We generate fears while we sit. We overcome them by action.',
      author: 'Dr. Henry Link',
    },
    {
      quote:
        'The only limit to our realization of tomorrow will be our doubts of today.',
      author: 'Franklin D. Roosevelt',
    },
    {
      quote:
        'The man who has confidence in himself gains the confidence of others.',
      author: 'Hasidic Proverb',
    },
  ];

  /**
   * Generate Random Motivational Quote
   * @return {void}
   */
  getRandomMotivationalQuote(): void {
    const randomIndex = Math.floor(
      Math.random() * this.motivationalQuotesList.length,
    );
    this.motivationalQuote = this.motivationalQuotesList[randomIndex].quote;
    this.motivationalQuoteAuthor =
      this.motivationalQuotesList[randomIndex].author;
  }
}
